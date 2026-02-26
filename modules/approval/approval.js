import { eventBus } from '../../core/eventBus.js';

async function approveBooking(id) {
    const { data: booking } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();
    
    if (booking.peralatan) {
        const alatList = booking.peralatan.split(',').map(a => a.trim());
        for (const alat of alatList) {
            await supabase.rpc('kurangi_stok', { nama_barang: alat, jumlah: 1 });
        }
    }
    eventBus.emit('booking-approved', booking);
}
