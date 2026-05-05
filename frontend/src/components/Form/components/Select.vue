<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    @change="handleChange"
    class="input-select"
  >
    <option v-if="clearable" value="">请选择</option>
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleChange(e) {
      this.$emit('update:modelValue', e.target.value)
    }
  }
}
</script>

<style scoped>
.input-select {
  width: 100%;
  height: 32px;
  padding: 4px 11px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: none;
  transition: all 0.3s;
  background: #fff;
}
.input-select:hover {
  border-color: #40a9ff;
}
.input-select:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
.input-select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
</style>
