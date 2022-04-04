
```javascript
// create a new controller instance
const controllerInstance = controller();

controllerInstance
  .do(( req, res, next, errCb) => {
    next('admin');
  })
  .do(( req, res, next, role) => {
    req.userRole = role;
    next();
  });

app.post('/admin/route', controllerInstance.middleware(), (req, res) => {
  console.log(req.userRole);
})

```
