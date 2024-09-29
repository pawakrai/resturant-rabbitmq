const client = require('./client')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
var amqp = require('amqplib/callback_api')
const {v4: uuidv4}=require("uuid");

const app = express()

// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'hbs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  client.getAllMenu(null, (err, data) => {
    if (!err) {
    //   res.render('menu', {
    //     results: data.menu,
    //   })
    res.send(data)
    }
  })
})

app.post('/placeorder', (req, res) => {
  var orderItem = {
    id: uuidv4(),
    name: req.body.name,
    quantity: req.body.quantity,
    type: req.body.type, // e.g., 'Chinese', 'Thai', 'International'
  }

  // Send the order msg to RabbitMQ
  amqp.connect('amqp://localhost', function (error0, connection) {
    if (error0) {
      throw error0
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1
      }
      var exchange = 'food_orders'
      var routingKey = orderItem.type // Use food type as routing key

      // Declare the exchange before publishing
      channel.assertExchange(exchange, 'topic', { durable: true });

      channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(orderItem)),
        {
          persistent: true,
        }
      )

      console.log(" [x] Sent '%s'", JSON.stringify(orderItem));
    });

    setTimeout(() => { connection.close(); }, 500); // Close connection after a short delay
  })

  // Add the order to the order list
    client.placeOrder(orderItem, (err, data) => {
        if (!err) {
        console.log('Order placed successfully', data)
        }
    });

  res.status(200).send('Order placed successfully');
})

app.get('/orders', (req, res) => {
  client.getAllOrders(null, (err, data) => {
    if (!err) {
      res.send(data)
    }
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('Server running at port %d', PORT)
})

//var data = [{
//   name: '********',
//   company: 'JP Morgan',
//   designation: 'Senior Application Engineer'
//}];
