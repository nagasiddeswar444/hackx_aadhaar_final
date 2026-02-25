export type MilestoneType = '15th_birthday' | '50th_birthday' | null;

export interface MilestoneInfo {
    type: MilestoneType;
    daysRemaining: number;
    birthdayDate: Date;
}

/**
 * Check if a user's DOB triggers an age milestone.
 * Trigger window: within 90 days before the 15th or 50th birthday.
 */
export function checkAgeMilestone(dob: string): MilestoneInfo | null {
    if (!dob) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dobDate = new Date(dob);
    const birthYear = dobDate.getFullYear();
    const birthMonth = dobDate.getMonth();
    const birthDay = dobDate.getDate();

    // Calculate 15th and 50th birthday dates
    const currentYear = today.getFullYear();

    const milestones = [15, 50];

    for (const milestone of milestones) {
        const targetBirthday = new Date(
            birthYear + milestone,
            birthMonth,
            birthDay
        );

        // If birthday already passed this year, check next year's equivalent
        if (targetBirthday < today) continue;

        const daysRemaining = Math.floor(
            (targetBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining >= 0 && daysRemaining <= 90) {
            return {
                type: milestone === 15 ? '15th_birthday' : '50th_birthday',
                daysRemaining,
                birthdayDate: targetBirthday,
            };
        }
    }

    return null;
}

/**
 * Get a human-readable string describing the milestone countdown.
 */
export function getMilestoneMessage(info: MilestoneInfo): string {
    const age = info.type === '15th_birthday' ? 15 : 50;
    if (info.daysRemaining === 0) {
        return `Today is your ${age}th birthday! Please update your biometrics.`;
    }
    return `${info.daysRemaining} days until your ${age}th birthday. Mandatory biometric update coming up.`;
}
