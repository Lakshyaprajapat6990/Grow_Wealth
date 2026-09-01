const Support = require('../models/Support');

async function createTicket(req, res) {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Subject and message required' });
  }

  const ticket = await Support.create({
    userId: req.user.userId,
    subject: subject.trim(),
    message: message.trim(),
  });

  return res.status(201).json({ success: true, message: 'Ticket submitted', ticket });
}

async function myTickets(req, res) {
  const tickets = await Support.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  return res.json({ success: true, supports: tickets });
}

async function adminList(req, res) {
  const tickets = await Support.find().sort({ createdAt: -1 }).limit(200);
  return res.json({ success: true, tickets });
}

async function adminReply(req, res) {
  const { id } = req.params;
  const { reply, status } = req.body;
  const ticket = await Support.findById(id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Not found' });

  if (reply) ticket.adminReply = reply;
  ticket.status = status || 'replied';
  ticket.repliedAt = new Date();
  ticket.repliedBy = req.user.userId;
  await ticket.save();

  return res.json({ success: true, ticket });
}

module.exports = { createTicket, myTickets, adminList, adminReply };
