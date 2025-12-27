<template>
  <div>
    <AppStats v-if="library.length > 0" :items="library" />

    <div class="max-w-xl mx-auto text-center">
      <div class="flex items-center justify-between px-3 pt-12 pb-6">
        <div class="text-2xl font-bold text-purple-100 font-arvo">Channels</div>
        <button @click.prevent="showModal({})" class="...">Add Channel</button>
      </div>

      <div v-if="isLoading" class="py-12 text-stone-400">
        Connecting to library...
      </div>

      <div v-else-if="library.length > 0" class="pb-12 text-left">
        <div class="space-y-6">
          <ChannelCard 
            v-for="channel in library" 
            :key="channel.uid" 
            :channel="channel" 
            @edit="showModal($event)" 
          />
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12 text-center">
        <p>Your library is empty.</p>
        <button @click.prevent="showModal({})" class="...">Add Channel</button>
      </div>
    </div>

    <AppModalTest :is-active="isModalActive">
      <FormChannel 
        @close="isModalActive = false" 
        @delete="deleteChannel" 
        @add="addChannel"
        @update="updateChannel" 
        :item="channelToEdit" 
        :isSaving="isSaving" 
      />
    </AppModalTest>
  </div>
</template>

<script setup>
import { useToast } from 'vue-toastification/dist/index.mjs'
const toast = useToast();

// 1. Reactive state
const library = ref([]);
const isModalActive = ref(false);
const isSaving = ref(false);
const channelToEdit = ref({});
const isLoading = ref(true); // Track initial loading state

// 2. Real-time Database Listener
let unsubscribe = null;

onMounted(() => {
  // We use our helper from useFirebase.ts
  unsubscribe = watchDb("channels", (data) => {
    console.log("🔥 Firestore Sync:", data);
    library.value = data;
    isLoading.value = false;
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

// 3. Actions
const showModal = (val) => {
  channelToEdit.value = val;
  isModalActive.value = !isModalActive.value;
};

const addChannel = async (data) => {
  isSaving.value = true;
  try {
    // Ensure we send a clean object, not a Vue Proxy
    const cleanData = JSON.parse(JSON.stringify(data));
    await addDocToFirestore("channels", cleanData);
    showToast(`${data.name} added`);
    isModalActive.value = false;
  } catch (e) {
    showToast("Error adding channel", "error");
  } finally {
    isSaving.value = false;
  }
};

const deleteChannel = async (id) => {
  if (!confirm("Are you sure?")) return;
  isSaving.value = true;
  await deleteDocFromFirestore("channels", id);
  isModalActive.value = false;
  isSaving.value = false;
  showToast("Channel deleted");
};

const updateChannel = async (channel) => {
  isSaving.value = true;
  // Use the UID to target the specific document
  await updateDocInFirestore("channels", channel.uid, channel);
  isModalActive.value = false;
  isSaving.value = false;
  showToast(`${channel.name} updated`);
};

const showToast = (msg) => {
  toast(msg, { timeout: 3000, bodyClassName: ["font-bold"] });
};
</script>

<style>
.Vue-Toastification__toast--default {
	background-color: #582287;
	color: #fff;
}
</style>
