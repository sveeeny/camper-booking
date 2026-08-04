<!-- components/LanguageSwitcher.vue -->
<template>
    <select v-model="locale" aria-label="Sprache wählen" class="min-w-[130px] rounded-lg border border-white/30 bg-white/95 px-3 py-2 pr-8 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
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
