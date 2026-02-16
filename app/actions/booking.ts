'use server';

import { getValidPhotographers } from '@/lib/scheduling-rules';

export async function checkCoverage(neighborhood: string, serviceIds: string[]) {
    try {
        const photographers = await getValidPhotographers(neighborhood, serviceIds);
        return {
            available: photographers.length > 0,
            count: photographers.length
        };
    } catch (error) {
        console.error('Error checking coverage:', error);
        return { available: false, error: 'Failed to check coverage' };
    }
}
