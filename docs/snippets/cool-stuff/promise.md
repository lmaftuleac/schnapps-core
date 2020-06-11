```javascript
const MyController = controller();


MyController
  .do((req, res, next, errCb, data) => {
    if (data) {
      return next({ success: 'ok' });
    } else {
      return errCb({ code: 500, message: 'error' });
    }
  })


app.post('/admin/route', async (req, res) => {
  try {
    const { success } = await AdminAccess.promise(req, res, { any: 'data' })
  } catch (err) {
    const { code, message } = error
  }
})
```
