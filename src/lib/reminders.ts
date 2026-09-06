import { getCase, getCustomer, isIsoDate, jakartaDate, type Database, type Letter } from './data';

export interface LetterReminder { letter: Letter; customerName: string; personnelName: string; lastActivity: string; dueDate: string; reason: string; daysLate: number; kind: 'report' | 'status' }
export function letterReminders(db: Database, today = jakartaDate()): LetterReminder[] {
  const interval = Math.min(30, Math.max(1, Number(db.settings.reportIntervalDays) || 3));
  return db.letters.filter(l => l.status === 'Aktif' && l.number && isIsoDate(l.issuedAt) && l.issuedAt <= today).flatMap(letter => {
    const c = getCase(db, letter.caseId); if (!c) return [];
    const reports = db.collections.filter(log => (log.letterId === letter.id || (!log.letterId && log.caseId === letter.caseId && log.personnelId === letter.personnelId)) && log.activityDate >= letter.issuedAt).map(log => log.activityDate);
    const updated = letter.updateNote?.trim() && letter.updatedAt ? jakartaDate(letter.updatedAt) : '';
    const lastActivity = [letter.issuedAt, ...reports, ...(updated ? [updated] : [])].filter(isIsoDate).sort().slice(-1)[0];
    const expired = !!letter.validUntil && isIsoDate(letter.validUntil) && letter.validUntil < today;
    const kind = c.status === 'Selesai' || expired ? 'status' as const : 'report' as const;
    const dueDate = kind === 'status' ? expired ? letter.validUntil! : today : new Date(Date.parse(lastActivity) + interval * 86400000).toISOString().slice(0, 10);
    if (dueDate > today) return [];
    return [{ letter, customerName: getCustomer(db, c.customerId)?.name || '-', personnelName: db.personnel.find(p => p.id === letter.personnelId)?.name || '-', lastActivity, dueDate, kind, reason: c.status === 'Selesai' ? 'Kasus selesai, status SK masih aktif' : expired ? 'Masa berlaku SK berakhir' : reports.length || updated ? 'Laporan perkembangan perlu diperbarui' : 'Belum ada laporan sejak SK terbit', daysLate: Math.max(0, Math.floor((Date.parse(today) - Date.parse(dueDate)) / 86400000)) }];
  }).sort((a, b) => (a.kind === b.kind ? b.daysLate - a.daysLate : a.kind === 'status' ? -1 : 1));
}