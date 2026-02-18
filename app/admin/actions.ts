'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { CURITIBA_NEIGHBORHOODS } from '@/lib/scheduling-rules';

export async function getAdminData() {
    const photographers = await (prisma as any).photographer.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
    });

    const curitibaRegion = await (prisma as any).region.findFirst({
        where: { name: 'Curitiba (Todos)' }
    });

    return {
        photographers,
        neighborhoods: (curitibaRegion?.neighborhoods as string[]) || CURITIBA_NEIGHBORHOODS
    };
}

export async function updatePhotographerNeighborhoods(id: string, neighborhoods: any) {
    try {
        await (prisma as any).photographer.update({
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
        await (prisma as any).photographer.update({
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

export async function updatePhotographerLocation(id: string, lat: number | null, lng: number | null, radius: number) {
    try {
        await (prisma as any).photographer.update({
            where: { id },
            data: {
                latitude: lat,
                longitude: lng,
                travelRadius: radius
            }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating location:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePhotographerColor(id: string, color: string) {
    try {
        await (prisma as any).photographer.update({
            where: { id },
            data: { color }
        });
        revalidatePath('/admin');
        revalidatePath('/secretaria/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating color:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePhotographerBase(id: string, address: string, lat: number | null, lng: number | null) {
    try {
        await (prisma as any).photographer.update({
            where: { id },
            data: {
                baseAddress: address,
                baseLat: lat,
                baseLng: lng
            }
        });
        revalidatePath('/admin');
        revalidatePath('/secretaria/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating base address:', error);
        return { success: false, error: error.message };
    }
}
