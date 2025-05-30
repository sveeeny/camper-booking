<!-- components/LanguageSwitcher.vue -->
<template>
    <select v-model="locale"
        class="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white">
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
