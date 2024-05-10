const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const AWS = require('aws-sdk');
 uuid  = require('uuid');

AWS.config.update({region: 'ap-south-1', endpoint: 'http://localhost:8000'});
const app = new Koa();
const router = new Router();
const dynamodb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser());


router.get('/product/:productId', async (ctx) => {
  const { productId } = ctx.params;

  const params = {
    TableName: 'Products',
    KeyConditionExpression: 'productId = :pid',
    ExpressionAttributeValues: {
      ':pid': productId
    }
  };

  try {
    const data = await dynamodb.query(params).promise();
    ctx.body = data;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.get('/products', async (ctx) => {
  const params = {
    TableName: 'Products'
  };

  try {
    const data = await dynamodb.scan(params).promise();
    ctx.body = data;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});



router.post('/product', async (ctx) => {
  const { name, category, price,quantity, } = ctx.request.body;

  const params = {
    TableName: 'Products',
    Item: {
      productId:"uuid",
      name,
      category,
      price,
      quantity,
    }
  };

  try {
    await dynamodb.put(params).promise();
    ctx.status = 201; 
    ctx.body = { message: 'Product created successfully' };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.patch('/product/:productId', async (ctx) => {
  const { productId } = ctx.params;
  const currentPrice = parseFloat(ctx.query.price); 
  const { name, category, quantity } = ctx.request.body;

  
  const params = {
    TableName: 'Products',
    Key: {
      'productId': productId,
      'price': currentPrice 
    },
    UpdateExpression: 'set #n = :name, #c = :category, #q = :quantity',
    ExpressionAttributeNames: {
      '#n': 'name',
      '#c': 'category',
      '#q': 'quantity',
    },
    ExpressionAttributeValues: {
      ':name': name,
      ':category': category,
      ':quantity': quantity,
    },
    ReturnValues: 'UPDATED_NEW'
  };

  
  try {
    
    const data = await dynamodb.update(params).promise();
    ctx.body = data;
  } catch (err) {
  
    ctx.status = 500;
    ctx.body = { error: 'Failed to update product', details: err };
  }
});


router.put('/product/:productId', async (ctx) => {
  const { productId } = ctx.params;
  const { name, category, price, quantity } = ctx.request.body;

  const params = {
    TableName: 'Products',
    Item: {
      'productId': productId,
      'name': name,
      'category': category,
      'price': price,
      'quantity': quantity,
    }
      
  };

  try {
    await dynamodb.put(params).promise();
    ctx.status = 200;
    ctx.body = { message: 'Product updated successfully' };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to update product', details: err };
  }
});

router.delete('/product/:productId', async (ctx) => {
  const { productId } = ctx.params;
  const currentPrice = parseFloat(ctx.query.price);

  const params = {
    TableName: 'Products',
    Key: {
      'productId': productId,
      'price': currentPrice

    }
  };

  try {
   
    await dynamodb.delete(params).promise();
    ctx.body = { message: 'Product deleted successfully' };
  } catch (err) {
   
    console.error('Error deleting product:', err);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete product', details: err };
  }
});



app.use(router.routes()).use(router.allowedMethods());
const port =  3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
