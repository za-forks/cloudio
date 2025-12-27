<template>
  <div style="background: white; color: black; padding: 50px; font-family: monospace;">
    <h1>Debug Environment</h1>
    <p>API Key Length: {{ config.public.FIREBASE_API_KEY?.length || 'UNDEFINED' }}</p>
    <p>Project ID: {{ config.public.FIREBASE_PROJECT_ID || 'UNDEFINED' }}</p>
    <hr />
    <pre>{{ config.public }}</pre>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
</script>
