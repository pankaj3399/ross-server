
import Stripe from 'stripe';
import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();

// Safety check using NODE_ENV
if (process.env.NODE_ENV === 'production') {
    console.error('❌ SAFETY ERROR: This script modifies the database and should NOT be run in production!');
    process.exit(1);
}

const API_URL = process.env.API_URL || 'http://localhost:4000';
const STRIPE_API_VERSION = '2025-12-15';

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Missing env var: STRIPE_SECRET_KEY');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION as any,
});

// Helper to generate signature
const generateSignature = (payload: string, secret: string) => {
    const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
    });
    return signature;
};

// Helper: Polling for condition
async function waitForCondition(
    description: string,
    predicate: () => Promise<boolean>,
    intervalMs: number = 500,
    timeoutMs: number = 10000
): Promise<void> {
    console.log(`Waiting for: ${description}...`);
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
        if (await predicate()) {
            return;
        }
        await new Promise(r => setTimeout(r, intervalMs));
    }
    
    throw new Error(`Timeout exceeded waiting for: ${description}`);
}

async function main() {
    console.log('🚀 Starting Webhook Simulation...');

    // 1. Find a test user
    const client = await pool.connect();
    let testUser;
    
    try {
        const result = await client.query(
            "SELECT id, stripe_customer_id, subscription_status FROM users WHERE stripe_customer_id IS NOT NULL LIMIT 1"
        );
        
        if (result.rows.length === 0) {
            console.error('❌ No user with stripe_customer_id found in database.');
            process.exit(1);
        }
        
        testUser = result.rows[0];
        console.log(`✅ Found test user: ID=${testUser.id}, CustomerID=${testUser.stripe_customer_id}, Status=${testUser.subscription_status}`);
    } finally {
        client.release();
    }

    // 2. Prepare Payload
    // Simulate changing to BASIC plan
    const TARGET_PRICE_ID = process.env.STRIPE_PRICE_ID_BASIC; 
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!TARGET_PRICE_ID || !WEBHOOK_SECRET) {
        console.error('❌ Missing env vars: STRIPE_PRICE_ID_BASIC or STRIPE_WEBHOOK_SECRET');
        process.exit(1);
    }

    const payload = {
        id: 'evt_test_webhook_' + Date.now(),
        object: 'event',
        api_version: STRIPE_API_VERSION,
        created: Math.floor(Date.now() / 1000),
        type: 'customer.subscription.updated',
        data: {
            object: {
                id: 'sub_test_' + Date.now(),
                object: 'subscription',
                customer: testUser.stripe_customer_id,
                status: 'active',
                items: {
                    data: [
                        {
                            price: {
                                id: TARGET_PRICE_ID
                            }
                        }
                    ]
                }
            }
        }
    };

    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, WEBHOOK_SECRET);

    console.log(`Sending webhook to ${API_URL}/webhook...`);
    console.log(`Target Plan: ${TARGET_PRICE_ID} (Basic Premium)`);

    // 3. Send Webhook
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(`${API_URL}/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': signature
            },
            body: payloadString,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            console.log('✅ Webhook sent successfully!');
        } else {
            const text = await response.text();
            console.error(`❌ Webhook failed: ${response.status} ${response.statusText}`);
            console.error(text);
            process.exit(1);
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
             console.error('❌ Request timed out after 10s');
        } else {
             console.error('❌ Failed to send request:', error);
        }
        process.exit(1);
    }

    // 4. Verification
    try {
        await waitForCondition('DB update to basic_premium', async () => {
            const checkClient = await pool.connect();
            try {
                 const result = await checkClient.query(
                    "SELECT subscription_status FROM users WHERE id = $1",
                    [testUser.id]
                );
                const newStatus = result.rows[0]?.subscription_status;
                if (newStatus === 'basic_premium') {
                    console.log('🎉 SUCCESS: User status was automatically updated to basic_premium!');
                    return true;
                }
                process.stdout.write('.'); // progress indicator
                return false;
            } finally {
                checkClient.release();
            }
        });
    } catch (e) {
         console.error('\n❌ FAILURE: Status did not update as expected within timeout.');
         await pool.end().catch((err) => console.error('Error closing pool:', err));
         process.exit(1);
    }

    // Clean up DB pool before exiting
    await pool.end().catch((err) => console.error('Error closing pool:', err));
    process.exit(0);
}

main().catch(async (error) => {
    console.error(error);
    await pool.end().catch((err) => console.error('Error closing pool:', err));
    process.exit(1);
});
