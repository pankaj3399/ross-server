
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

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Missing env var: STRIPE_SECRET_KEY');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// Helper to generate signature
const generateSignature = (payload: string, secret: string) => {
    const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
    });
    return signature;
};

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
        api_version: '2023-10-16',
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
        const response = await fetch(`${API_URL}/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': signature
            },
            body: payloadString
        });

        if (response.ok) {
            console.log('✅ Webhook sent successfully!');
        } else {
            const text = await response.text();
            console.error(`❌ Webhook failed: ${response.status} ${response.statusText}`);
            console.error(text);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Failed to send request:', error);
        process.exit(1);
    }

    // 4. Verification
    console.log('Waiting 2 seconds for DB update...');
    await new Promise(r => setTimeout(r, 2000));

    const checkClient = await pool.connect();
    try {
        const result = await checkClient.query(
            "SELECT subscription_status FROM users WHERE id = $1",
            [testUser.id]
        );

        if (!result.rows || result.rows.length === 0) {
            console.error(`❌ User ${testUser.id} not found when verifying status.`);
            process.exitCode = 1;
            return;
        }

        const newStatus = result.rows[0].subscription_status;
        console.log(`Current DB Status: ${newStatus}`);
        
        if (newStatus === 'basic_premium') {
            console.log('🎉 SUCCESS: User status was automatically updated to basic_premium!');
        } else {
            console.error('❌ FAILURE: Status did not update as expected.');
            process.exit(1);
        }
    } finally {
        checkClient.release();
    }

    process.exit();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
