#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

// Get the binding key from command line arguments
const bindingKeys = process.argv.slice(2);
const defaultBindingKey = '#'

const keysToBind = bindingKeys.length > 0 ? bindingKeys : [defaultBindingKey];

amqp.connect('amqp://localhost', function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        var exchange = 'food_orders';

        channel.assertExchange(exchange, 'topic', { durable: true });
        
        // Create a queue for receiving messages
        channel.assertQueue('', { exclusive: true }, function (error2, q) {
            if (error2) {
                throw error2;
            }

            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
            console.log(" [*] Binding to key: '%s'", keysToBind.join(', '));

            // Bind the queue to the exchange with the specified binding key
            keysToBind.forEach(bindingKey => {
                channel.bindQueue(q.queue, exchange, bindingKey)
            })

            channel.consume(q.queue, function (msg) {
                console.log(" [x] Received %s", msg.content.toString());
                // Here you can add logic to handle different types of food orders
                channel.ack(msg);
            }, { noAck: false });
        });
    });
});