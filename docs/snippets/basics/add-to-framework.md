```javascript
// use with express
/** 
 * In order to initiate our controller, we need to call our controller with two parameters:
 * req - request object
 * res - response object
 * data - a third optional parameter can be passed which will be considered as input data to first handler in the call chain
 */

app.post('/admin/route', (req, res) => DoSomethingAsAdmin(req, res, { any: 'data' }))

// use with hapi

/** 
 * Note that Hapi uses request and h (response toolkit object)
 * which is reflected on how we should handle our response in our controller chain
 */
server.route({
    method: 'POST',
    path:'/admin/route',
    handler: (request, h) => DoSomethingAsAdmin(request, h, { any: 'data' })
});

```