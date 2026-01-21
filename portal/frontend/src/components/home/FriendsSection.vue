<template>
  <div class="friends-section">
    <div class="section-header">
      <h2 id="friends-section-title">👥 Your Racing Crew</h2>
      <button 
        @click="$emit('add-friend')" 
        class="btn-primary btn-sm"
        aria-label="Add a new friend"
      >
        + Add Friend
      </button>
    </div>

    <div v-if="loading" class="loading-state" role="status" aria-live="polite">
      Loading friends...
    </div>
    <div v-else-if="error" class="error-state" role="alert" aria-live="assertive">
      <p class="error-message">⚠️ {{ error }}</p>
      <button @click="$emit('retry')" class="btn-secondary btn-sm">Retry</button>
    </div>
    <div v-else-if="friends.length === 0" class="empty-state">
      <p>No friends added yet</p>
      <p class="text-muted">Add friends to track their stats alongside yours!</p>
    </div>
    <div 
      v-else 
      class="friends-list" 
      role="list"
      aria-labelledby="friends-section-title"
    >
      <div 
        v-for="friend in friends" 
        :key="friend.id" 
        class="friend-card"
        role="listitem"
      >
        <div class="friend-info">
          <div 
            class="friend-avatar" 
            :aria-label="`${friend.name} avatar`"
          >
            {{ friend.name.charAt(0) }}
          </div>
          <div class="friend-details">
            <div class="friend-name">{{ friend.name }}</div>
            <div class="friend-meta">Added {{ formatDate(friend.added_at) }}</div>
          </div>
        </div>
        <button 
          @click="handleRemoveFriend(friend.id)" 
          :disabled="removingFriendId === friend.id"
          class="btn-icon btn-danger" 
          :title="`Remove ${friend.name} from friends`"
          :aria-label="`Remove ${friend.name} from friends`"
        >
          <span v-if="removingFriendId === friend.id">⏳</span>
          <span v-else>✕</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Friend {
  id: number
  driver_id: number
  name: string
  added_at: string
}

const props = defineProps<{
  friends: Friend[]
  loading: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'add-friend': []
  'remove-friend': [id: number]
  'retry': []
}>()

const removingFriendId = ref<number | null>(null)

const handleRemoveFriend = (friendId: number) => {
  removingFriendId.value = friendId
  emit('remove-friend', friendId)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
