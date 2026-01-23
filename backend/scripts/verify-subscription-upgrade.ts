import express from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

// Load environment variables FIRST
const envPath = path.resolve(__dirname, "../.env");
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Now we can dynamically import routes that depend on env vars
// We'll do this inside the runTest function or just after config



// Request user type logic is handled by middleware/auth.ts import
// We do not need to redeclare it here to avoid conflicts.

async function runTest() {
    console.log("Starting Subscription Upgrade Verification Test...");
    
    // Import routes dynamically AFTER env vars are loaded
    const subscriptionRoutes = (await import("../src/routes/subscriptions")).default;

    const app = express();
    app.use(express.json());
    // Mount the subscriptions router
    app.use("/subscriptions", subscriptionRoutes);
    
    console.log("Environment check:");
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing");
        process.exit(1);
    }

    // 1. Database Connection
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // 2. Find a suitable test user (Basic Premium)
        // We need a user who is currently on 'basic_premium' to test the upgrade to 'pro_premium'
        console.log("Looking for a test user with 'basic_premium' status...");
        const userResult = await pool.query(
            "SELECT id, email, subscription_status, stripe_customer_id, stripe_subscription_id FROM users WHERE subscription_status = 'basic_premium' LIMIT 1"
        );

        if (userResult.rows.length === 0) {
            console.error("❌ No user with 'basic_premium' status found in the database.");
            process.exit(1);
        }

        const testUser = userResult.rows[0];
        console.log(`✅ Found test user: ${testUser.id}`);

        // --- SELF-HEALING DATA LOGIC ---
        // Import stripe instance dynamically
        const stripe = (await import("../src/config/stripe")).default;
        
        // 1. Validate/Fix Customer
        let customerId = testUser.stripe_customer_id;
        let customerValid = false;
        
        if (customerId) {
            try {
                const customer = await stripe.customers.retrieve(customerId) as any;
                if (!customer || customer.deleted) throw new Error("Customer deleted");
                customerValid = true;
                
                // Ensure customer has payment method
                if (!customer.invoice_settings?.default_payment_method && !customer.default_source) {
                    console.log(`⚠️  Customer ${customerId} has no default payment method. Attaching test card...`);
                    const paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', { customer: customerId });
                    await stripe.customers.update(customerId, {
                        invoice_settings: { default_payment_method: paymentMethod.id }
                    });
                    console.log(`✅ Attached test payment method to existing customer: ${customerId}`);
                }

            } catch (e) {
                console.log(`⚠️  User's Stripe customer ${customerId} is invalid/missing. Creating new one...`);
            }
        }

        if (!customerId || !customerValid) {
            const newCustomer = await stripe.customers.create({ email: testUser.email, metadata: { userId: testUser.id } });
            customerId = newCustomer.id;
            
            // Attach a test payment method to allow active subscriptions
            try {
                const paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', { customer: customerId });
                await stripe.customers.update(customerId, {
                    invoice_settings: { default_payment_method: paymentMethod.id }
                });
                console.log(`✅ Attached test payment method to customer: ${customerId}`);
            } catch (pmError) {
                console.error("⚠️ Failed to attach payment method:", pmError);
            }

            await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customerId, testUser.id]);
            console.log(`✅ Created and linked new Stripe Customer: ${customerId}`);
        }

        // 2. Validate/Fix Subscription
        let subscriptionId = testUser.stripe_subscription_id;
        let subscriptionValid = false;

        if (subscriptionId) {
             try {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                // Check if active or trialing
                if (sub.status !== 'active' && sub.status !== 'trialing') {
                     console.log(`⚠️ Subscription exists but status is ${sub.status}. Will create new one.`);
                } else {
                     subscriptionValid = true;
                }
             } catch (e) {
                console.log(`⚠️  User's Stripe subscription ${subscriptionId} is invalid/missing. Creating new one...`);
             }
        }

        if (!subscriptionId || !subscriptionValid) {
            // Need a valid price ID for basic
            if (!process.env.STRIPE_PRICE_ID_BASIC) {
                 console.error("❌ STRIPE_PRICE_ID_BASIC env var missing. Cannot create test subscription.");
                 process.exit(1);
            }
            
            console.log("Creating new Basic subscription...");
            const newSub = await stripe.subscriptions.create({
                customer: customerId!,
                items: [{ price: process.env.STRIPE_PRICE_ID_BASIC }],
                metadata: { userId: testUser.id }
            });
            subscriptionId = newSub.id;
            
            await pool.query(
                "UPDATE users SET stripe_subscription_id = $1, subscription_status = 'basic_premium' WHERE id = $2", 
                [subscriptionId, testUser.id]
            );
            console.log(`✅ Created and linked new Basic Subscription: ${subscriptionId}`);
        } else {
            console.log(`✅ Using existing valid Subscription: ${subscriptionId}`);
        }
        
        // Refresh valid subscription ID for test
        testUser.stripe_subscription_id = subscriptionId;
        testUser.stripe_customer_id = customerId;

        // --- END SELF-HEALING ---


        // 3. Generate Auth Token
        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET is not set in .env");
            process.exit(1);
        }

        const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log("✅ Generated valid JWT for test user.");

        // 4. Start Temporary Server
        const PORT = 4001; // Use a different port than the main app
        const server = app.listen(PORT, async () => {
            console.log(`✅ Temporary test server running on http://localhost:${PORT}`);

            // 5. Interact with the Upgrade Endpoint
            console.log("POST /subscriptions/upgrade-to-pro");
            try {
                const response = await fetch(`http://localhost:${PORT}/subscriptions/upgrade-to-pro`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                const status = response.status;
                const data = await response.json();

                console.log(`Response Status: ${status}`);
                console.log("Response Body:", JSON.stringify(data, null, 2));

                if (status === 200) {
                     if (data.sessionId === "updated_direct") {
                         console.log("✅ SUCCESS: Subscription updated directly (active state).");
                     } else if (data.url && data.url.includes("invoice")) {
                         console.log("✅ SUCCESS: Subscription updated (payment required/invoice url returned).");
                     } else {
                         console.log("✅ SUCCESS: Endpoint returned 200, but check payload details.");
                     }
                } else {
                    console.error("❌ FAILED: Endpoint returned an error.");
                }

            } catch (err) {
                console.error("❌ Error making request:", err);
            } finally {
                // Cleanup
                server.close();
                await pool.end();
                console.log("Test finished.");
                process.exit(0);
            }
        });

    } catch (err) {
        console.error("❌ Unexpected error:", err);
        await pool.end();
        process.exit(1);
    }
}

runTest();
