<!-- components/LanguageSwitcher.vue -->
<template>
    <select v-model="locale" class="px-2 py-1 pr-6 rounded border text-sm min-w-[130px] g-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border dark:border-slate-600">
        <option value="de">🇩🇪 Deutsch</option>
        <option value="en">🇬🇧 English</option>
    </select>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { watch } from 'vue';

const { locale } = useI18n();

watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale);
});

</script>
