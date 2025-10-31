<template>
  <admin-layout>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <!-- xl:col-span-19 -->
      <div class="col-span-12 space-y-6">
        <ecommerce-metrics />
        <monthly-target />
      </div>
    </div>
  </admin-layout>
</template>

<script>
import AdminLayout from '../components/layout/AdminLayout.vue' 
export default {
  components: {
    AdminLayout, 
  },
  name: 'Ecommerce',
}
</script>
