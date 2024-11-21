(async function () {
    // Ensure the Checkout SDK is loaded
    if (!window.checkoutKitLoader) {
        console.error('Checkout SDK loader is not available.');
        return;
    }

    try {
        // Load the Checkout SDK module
        const module = await window.checkoutKitLoader.load('checkout-sdk');

        // Create a checkout service instance
        const service = module.createCheckoutService();

        // Load the checkout state
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

        console.log('Custom payment method initialized successfully.');
    } catch (error) {
        console.error('Error initializing payment:', error);
    }
})();
