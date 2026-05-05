<template>
  <input
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxlength"
    @input="handleInput"
    class="input-text"
  />
</template>

<script>
export default {
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    maxlength: {
      type: Number,
      default: undefined
    }
  },
  methods: {
    handleInput(e) {
      this.$emit('update:modelValue', e.target.value)
    }
  }
}
</script>

<style scoped>
.input-text {
  width: 100%;
  height: 32px;
  padding: 4px 11px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: none;
  transition: all 0.3s;
}
.input-text:hover {
  border-color: #40a9ff;
}
.input-text:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
.input-text:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
</style>
