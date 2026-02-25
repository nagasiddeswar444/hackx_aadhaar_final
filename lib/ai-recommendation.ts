import { Slot } from './supabase';

export type ScoredSlot = Slot & {
    score: number;
    isRecommended: boolean;
    reason: string;
    estimatedWaitTime: number;
};

/**
 * Calculate off-peak bonus for a given time slot.
 * Best: 09:00-11:00 or 14:00-16:00
 * Ok: 11:00-14:00
 * Poor: before 09:00 or after 16:00
 */
function getOffPeakBonus(time: string): number {
    const [hourStr] = time.split(':');
    const hour = parseInt(hourStr, 10);

    if ((hour >= 9 && hour < 11) || (hour >= 14 && hour < 16)) {
        return 1.0; // Best off-peak
    } else if (hour >= 11 && hour < 14) {
        return 0.5; // Mid-day
    }
    return 0.3; // Early morning / late afternoon
}

/**
 * Score a slot based on:
 * - 60%: Availability factor (1 - booked/capacity)
 * - 40%: Off-peak time bonus
 */
function scoreSlot(slot: Slot): number {
    const availabilityFactor = slot.capacity > 0
        ? (1 - slot.booked_count / slot.capacity)
        : 0;
    const offPeakBonus = getOffPeakBonus(slot.time);

    return (availabilityFactor * 60) + (offPeakBonus * 40);
}

function getReason(slot: Slot): string {
    const [hourStr] = slot.time.split(':');
    const hour = parseInt(hourStr, 10);
    const availability = slot.capacity - slot.booked_count;

    const parts: string[] = [];

    if (availability > slot.capacity * 0.7) {
        parts.push('Very low crowd');
    } else if (availability > slot.capacity * 0.4) {
        parts.push('Low crowd');
    }

    if ((hour >= 9 && hour < 11) || (hour >= 14 && hour < 16)) {
        parts.push('Off-peak hours');
    }

    return parts.join(' + ') || 'Best available slot';
}

/**
 * Score all slots and return them sorted, with the top slot marked as recommended.
 */
export function recommendSlots(slots: Slot[]): ScoredSlot[] {
    // Filter out full slots
    const available = slots.filter(s => s.booked_count < s.capacity);

    const scored = available.map(slot => {
        const score = scoreSlot(slot);
        const [hourStr] = slot.time.split(':');
        const hour = parseInt(hourStr, 10);
        const baseWait = ((hour >= 9 && hour < 11) || (hour >= 14 && hour < 16)) ? 10 : 25;
        const waitTime = baseWait + (slot.booked_count * 2);

        return {
            ...slot,
            score,
            isRecommended: false,
            reason: getReason(slot),
            estimatedWaitTime: waitTime,
        };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Mark the best slot
    if (scored.length > 0) {
        scored[0].isRecommended = true;
    }

    return scored;
}

export function formatTime(time: string): string {
    const [hourStr, minStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const min = minStr || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${min} ${ampm}`;
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
