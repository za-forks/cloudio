<template>
  <div>
    <ClientOnly>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      
      <template #fallback>
        <div class="h-screen flex items-center justify-center bg-gray-900 text-white">
          <p class="animate-pulse">Loading Cloudio Radio...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
