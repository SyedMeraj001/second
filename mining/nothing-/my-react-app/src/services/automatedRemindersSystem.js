// Automated Reminders System
class AutomatedRemindersSystem {
  constructor() {
    this.reminders = [];
    this.checkInterval = null;
  }

  start() {
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60000); // Check every minute
  }

  stop() {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  addReminder(reminder) {
    const newReminder = {
      id: Date.now(),
      title: reminder.title,
      description: reminder.description,
      dueDate: new Date(reminder.dueDate),
      type: reminder.type,
      priority: reminder.priority,
      notifyBefore: reminder.notifyBefore || [7, 3, 1],
      recipients: reminder.recipients || [],
      status: 'active'
    };
    this.reminders.push(newReminder);
    return newReminder;
  }

  checkReminders() {
    const now = new Date();
    this.reminders.forEach(reminder => {
      if (reminder.status !== 'active') return;
      const daysUntilDue = Math.ceil((reminder.dueDate - now) / (1000 * 60 * 60 * 24));
      if (reminder.notifyBefore.includes(daysUntilDue)) {
        this.sendNotification(reminder, daysUntilDue);
      }
      if (daysUntilDue < 0) {
        reminder.status = 'overdue';
      }
    });
  }

  sendNotification(reminder, daysLeft) {
    const notification = {
      title: `Reminder: ${reminder.title}`,
      message: `Due in ${daysLeft} days`,
      priority: reminder.priority
    };
    this.displayNotification(notification);
  }

  displayNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, { body: notification.message });
    }
    const event = new CustomEvent('esg-notification', { detail: notification });
    window.dispatchEvent(event);
  }

  getActiveReminders() {
    return this.reminders.filter(r => r.status === 'active');
  }

  getOverdueReminders() {
    return this.reminders.filter(r => r.status === 'overdue');
  }

  getUpcomingReminders(days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.reminders.filter(r => r.status === 'active' && r.dueDate >= now && r.dueDate <= futureDate);
  }

  markAsComplete(reminderId) {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) reminder.status = 'completed';
  }

  addComplianceReminders() {
    const commonDeadlines = [
      { title: 'GRI Annual Report', description: 'Submit annual GRI report', dueDate: new Date(new Date().getFullYear(), 2, 31), type: 'report', priority: 'high', notifyBefore: [30, 14, 7, 3, 1] },
      { title: 'CDP Climate Disclosure', description: 'Complete CDP questionnaire', dueDate: new Date(new Date().getFullYear(), 6, 31), type: 'deadline', priority: 'high', notifyBefore: [60, 30, 14, 7] }
    ];
    commonDeadlines.forEach(deadline => this.addReminder(deadline));
  }
}

export default new AutomatedRemindersSystem();
