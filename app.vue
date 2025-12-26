<template>
  <div>
    <div style="background: red; color: white; padding: 20px; position: fixed; z-index: 9999;">
      Debug Key: {{ config.public.FIREBASE_API_KEY || 'MISSING' }}
    </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
</script>
