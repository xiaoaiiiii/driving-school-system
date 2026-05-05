<template>
  <button
    :class="buttonClass"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-loading"></span>
    <slot></slot>
  </button>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'primary', 'danger', 'ghost'].includes(value)
    },
    size: {
      type: String,
      default: 'default',
      validator: (value) => ['small', 'default', 'large'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    buttonClass() {
      return [
        'btn',
        `btn-${this.type}`,
        `btn-${this.size}`,
        { 'btn-disabled': this.disabled || this.loading }
      ]
    }
  },
  methods: {
    handleClick(e) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', e)
      }
    }
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  outline: none;
  padding: 4px 15px;
}
.btn-default {
  background: #fff;
  border-color: #d9d9d9;
  color: rgba(0, 0, 0, 0.65);
}
.btn-default:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}
.btn-primary {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
.btn-primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}
.btn-danger {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}
.btn-danger:hover {
  background: #ff7875;
  border-color: #ff7875;
}
.btn-ghost {
  background: transparent;
  border-color: #d9d9d9;
  color: rgba(0, 0, 0, 0.65);
}
.btn-ghost:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}
.btn-small {
  height: 24px;
  font-size: 14px;
  padding: 0 7px;
}
.btn-large {
  height: 40px;
  font-size: 16px;
  padding: 6.4px 15px;
}
.btn-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.btn-loading {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
