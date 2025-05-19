<!-- src/components/Host/BookingTable.vue -->
<template>
    <table class="w-full border text-sm text-slate-700 dark:text-slate-200">
        <thead class="bg-slate-100 dark:bg-slate-800">
            <tr>
                <th class="text-left p-2">Gast</th>
                <th class="text-left p-2">Anreise</th>
                <th class="text-left p-2">Abreise</th>
                <th class="text-left p-2">Fahrzeug</th>
                <th class="text-left p-2">Insassen</th>
            </tr>
        </thead>
        <tbody>
            <tr v-if="loading">
                <td colspan="5" class="p-4 text-center text-slate-500">Lade Buchungen…</td>
            </tr>
            <tr v-else-if="bookings.length === 0">
                <td colspan="5" class="p-4 text-center text-slate-500">Keine Buchungen an diesem Tag</td>
            </tr>
            <tr v-for="booking in bookings" :key="booking.id + booking.spot"
                class="border-t hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                @click="$emit('select', booking.id)">
                <td class="p-2">{{ booking.guestName }}</td>
                <td class="p-2">{{ formatToCH(new Date(booking.checkIn)) }}</td>
                <td class="p-2">{{ formatToCH(new Date(booking.checkOut)) }}</td>
                <td class="p-2">{{ booking.carPlate }}</td>
                <td class="p-2">{{ booking.adults + booking.children }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup lang="ts">
import type { HostBookingSummary } from '@/types';
import { formatToCH } from '@/composables/utils/dateUtils'



defineProps<{
    bookings: HostBookingSummary[];
    loading: boolean;
}>();

defineEmits<{
    (e: 'select', id: string): void;
}>();
</script>
