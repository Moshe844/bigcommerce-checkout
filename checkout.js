const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Serve custom SDK script
app.get('/custom-payment.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
        const { createCheckoutService } = require('@bigcommerce/checkout-sdk');

        async function initializeCustomPayment() {
            const service = createCheckoutService();

            try {
                // Load checkout information
                const state = await service.loadCheckout();
                console.log('Checkout state:', state);

                // Initialize your custom payment method
                await service.initializePayment({
                    methodId: 'custom',
                    custom: {
                        onSubmit: async (paymentData, paymentMethod) => {
                            const response = await fetch('${process.env.PAYMENT_ENDPOINT}', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/xml',
                                },
                                body: \`
                                    <txn>
                                        <ssl_transaction_type>ccsale</ssl_transaction_type>
                                        <ssl_card_number>\${paymentData.cardNumber}</ssl_card_number>
                                        <ssl_exp_date>\${paymentData.expiryDate}</ssl_exp_date>
                                        <ssl_cvv2cvc2>\${paymentData.cvv}</ssl_cvv2cvc2>
                                        <ssl_amount>\${state.data.getOrder().grandTotal}</ssl_amount>
                                    </txn>
                                \`,
                            });

                            if (!response.ok) {
                                throw new Error('Payment failed');
                            }

                            const result = await response.text();
                            console.log('Payment response:', result);

                            // Finalize the order in BigCommerce
                            await service.submitOrder({ payment: { methodId: 'custom' } });
                        },
                    },
                });

                console.log('Custom payment method initialized.');
            } catch (error) {
                console.error('Error initializing payment:', error);
            }
        }

        // Run the script
        initializeCustomPayment();
    `);
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Custom payment integration server running on port ${PORT}`);
});
