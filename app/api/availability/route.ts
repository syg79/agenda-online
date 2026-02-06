import { NextResponse } from 'next/server';

// Mock data - will be replaced by database queries
const ALL_SERVICES = [
    { id: 'photo', name: 'Fotos', duration: 40 },
    { id: 'video_landscape', name: 'Vídeo Paisagem', duration: 50 },
    { id: 'video_portrait', name: 'Vídeo Retrato', duration: 50 },
    { id: 'drone_photo', name: 'Drone - Fotos', duration: 25 },
    { id: 'drone_photo_video', name: 'Drone - Fotos + Vídeo', duration: 40 }
];

const ALL_PHOTOGRAPHERS = [
    { id: 1, name: 'Augusto', services: ['photo', 'video'] },
    { id: 2, name: 'Renato', services: ['photo'] },
    { id: 3, name: 'Rafael', services: ['photo', 'video', 'drone'] },
    { id: 4, name: 'Rodrigo', services: ['photo'] }
];

// Helper function to calculate total duration for selected services
const getTotalDuration = (serviceIds: string[]): number => {
    return serviceIds.reduce((total, id) => {
        const service = ALL_SERVICES.find(s => s.id === id);
        return total + (service ? service.duration : 0);
    }, 0);
};

// Helper function to get the number of 30-min slots needed
const getSlotsNeeded = (duration: number): number => {
    return Math.ceil(duration / 30);
};

// Helper function to find how many photographers can perform a set of services
const getAvailablePhotographers = (serviceIds: string[]): number => {
    const needsVideo = serviceIds.includes('video_landscape') || serviceIds.includes('video_portrait');
    const needsDrone = serviceIds.includes('drone_photo') || serviceIds.includes('drone_photo_video');

    // TODO: This should check against real bookings and time-blocks from the database.
    // For now, it just checks who *can* do the job, assuming they are always free.
    return ALL_PHOTOGRAPHERS.filter(p => {
        const canDoVideo = !needsVideo || p.services.includes('video');
        const canDoDrone = !needsDrone || p.services.includes('drone');
        const canDoPhoto = p.services.includes('photo'); // Assuming photo is always a base service
        return canDoVideo && canDoDrone && canDoPhoto;
    }).length;
};


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const servicesStr = searchParams.get('services');

    if (!dateStr || !servicesStr) {
        return NextResponse.json({ error: 'Date and services are required' }, { status: 400 });
    }

    try {
        const selectedServices = servicesStr.split(',');
        const targetDate = new Date(dateStr);
        
        // In JavaScript, creating a Date from 'YYYY-MM-DD' string creates it in UTC.
        // We need to adjust for the local timezone to get the correct weekday.
        const utcDate = new Date(targetDate.valueOf() + targetDate.getTimezoneOffset() * 60 * 1000);

        const dayOfWeek = utcDate.getDay();
        const isSunday = dayOfWeek === 0;

        if (isSunday) {
            return NextResponse.json({ slots: [] });
        }

        const duration = getTotalDuration(selectedServices);
        const slotsNeeded = getSlotsNeeded(duration);
        
        const isSaturday = dayOfWeek === 6;
        const startHour = 8;
        const endHour = isSaturday ? 13 : 17.5;
        const availableSlots = [];

        // TODO: This logic should be much more complex, checking for conflicts with real bookings.
        for (let hour = startHour; hour < endHour; hour += 0.5) {
            const h = Math.floor(hour);
            const m = hour % 1 === 0 ? '00' : '30';
            const timeStr = `${h.toString().padStart(2, '0')}:${m}`;
            const timeValue = h + (m === '30' ? 0.5 : 0);

            // Check if there's enough time left in the day for this job
            const remainingSlotsInDay = (endHour - timeValue) / 0.5;
            if (remainingSlotsInDay < slotsNeeded) {
                continue;
            }

            // Check how many photographers are available (mocked)
            const availablePhotographers = getAvailablePhotographers(selectedServices);

            if (availablePhotographers > 0) {
                const endTimeValue = timeValue + (slotsNeeded * 0.5);
                const endH = Math.floor(endTimeValue);
                const endM = endTimeValue % 1 === 0 ? '00' : '30';
                const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM}`;
                
                availableSlots.push({ 
                    time: timeStr, 
                    endTime: endTimeStr, 
                    available: availablePhotographers 
                });
            }
        }

        return NextResponse.json({ slots: availableSlots });

    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
