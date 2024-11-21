(async function () {
    const { createCheckoutService } = window['checkout-sdk'];


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
                        const response = await fetch('https://converge-bigcommerce.onrender.com/api/process-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/xml',
                            },
                            body: `
                                <txn>
                                    <ssl_transaction_type>ccsale</ssl_transaction_type>
                                    <ssl_card_number>${paymentData.cardNumber}</ssl_card_number>
                                    <ssl_exp_date>${paymentData.expiryDate}</ssl_exp_date>
                                    <ssl_cvv2cvc2>${paymentData.cvv}</ssl_cvv2cvc2>
                                    <ssl_amount>${state.data.getOrder().grandTotal}</ssl_amount>
                                </txn>
                            `,
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
})();
