<!-- components/LanguageSwitcher.vue -->
<template>
    <select v-model="locale" class="px-2 py-1 pr-6 rounded border text-sm min-w-[130px]">
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
