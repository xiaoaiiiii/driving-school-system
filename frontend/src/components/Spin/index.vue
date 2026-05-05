<template>
  <div v-if="visible" class="spin-container">
    <div class="spin-loading">
      <div class="spin-dot spin-dot-spin">
        <i class="spin-dot-item"></i>
        <i class="spin-dot-item"></i>
        <i class="spin-dot-item"></i>
        <i class="spin-dot-item"></i>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
.spin-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  z-index: 1000;
}
.spin-loading {
  position: relative;
  width: 20px;
  height: 20px;
}
.spin-dot {
  position: relative;
  font-size: 20px;
  width: 1em;
  height: 1em;
  display: inline-block;
  box-sizing: border-box;
}
.spin-dot-spin {
  transform: rotate(45deg);
  animation: antRotate 1.2s infinite linear;
}
.spin-dot-item {
  position: absolute;
  display: block;
  width: 9px;
  height: 9px;
  background-color: #1890ff;
  border-radius: 100%;
  opacity: 0.3;
  animation: antSpinMove 1s infinite linear alternate;
}
.spin-dot-item:nth-child(1) {
  top: 0;
  left: 0;
}
.spin-dot-item:nth-child(2) {
  top: 0;
  right: 0;
  animation-delay: 0.4s;
}
.spin-dot-item:nth-child(3) {
  bottom: 0;
  right: 0;
  animation-delay: 0.8s;
}
.spin-dot-item:nth-child(4) {
  bottom: 0;
  left: 0;
  animation-delay: 1.2s;
}
@keyframes antRotate {
  to {
    transform: rotate(405deg);
  }
}
@keyframes antSpinMove {
  to {
    opacity: 1;
  }
}
</style>
