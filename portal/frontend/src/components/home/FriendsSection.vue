<template>
  <div class="friends-section">
    <div class="section-header">
      <h2>👥 Your Racing Crew</h2>
      <button @click="$emit('add-friend')" class="btn-primary btn-sm">
        + Add Friend
      </button>
    </div>

    <div v-if="loading" class="loading-state">Loading friends...</div>
    <div v-else-if="friends.length === 0" class="empty-state">
      <p>No friends added yet</p>
      <p class="text-muted">Add friends to track their stats alongside yours!</p>
    </div>
    <div v-else class="friends-list">
      <div v-for="friend in friends" :key="friend.id" class="friend-card">
        <div class="friend-info">
          <div class="friend-avatar">{{ friend.name.charAt(0) }}</div>
          <div class="friend-details">
            <div class="friend-name">{{ friend.name }}</div>
            <div class="friend-meta">Added {{ formatDate(friend.added_at) }}</div>
          </div>
        </div>
        <button @click="$emit('remove-friend', friend.id)" class="btn-icon btn-danger" title="Remove friend">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Friend {
  id: number
  driver_id: number
  name: string
  added_at: string
}

defineProps<{
  friends: Friend[]
  loading: boolean
}>()

defineEmits<{
  'add-friend': []
  'remove-friend': [id: number]
}>()

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
