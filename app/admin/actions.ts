'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAdminData() {
    const photographers = await prisma.photographer.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
    });

    const curitibaRegion = await prisma.region.findFirst({
        where: { name: 'Curitiba (Todos)' }
    });

    return {
        photographers,
        neighborhoods: curitibaRegion?.neighborhoods || []
    };
}

export async function updatePhotographerNeighborhoods(id: string, neighborhoods: any) {
    try {
        await prisma.photographer.update({
            where: { id },
            data: { neighborhoods }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Error updating photographer:', error);
        return { success: false, error: 'Failed to update' };
    }
}

export async function updatePhotographerServices(id: string, services: string[]) {
    try {
        await prisma.photographer.update({
            where: { id },
            data: { services }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating services:', error);
        return { success: false, error: error.message };
    }
}
