```javascript
const AdminAccessMiddleware = controller(AdminAccess)
  .do(( req, res, next, errCb, { role }) => {
    req.userRole = role;
    next();
  })
  .toMiddleware()

app.post('/admin/route', AdminAccessMiddleware, async (req, res) => {
  console.log(req.userRole);
})

```