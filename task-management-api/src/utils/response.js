// all successful responses look like { success: true, data, meta }
function sendOk(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  res.status(200).json(body);
}

function sendCreated(res, data) {
  res.status(201).json({ success: true, data });
}

module.exports = { sendOk, sendCreated };