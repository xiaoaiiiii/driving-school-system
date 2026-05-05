<template>
  <a-date-picker
    :value="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    @change="handleChange"
    style="width: 100%"
  />
</template>

<script>
import { DatePicker as ADatePicker } from 'ant-design-vue'

export default {
  components: {
    ADatePicker
  },
  props: {
    modelValue: {
      type: [String, Date],
      default: null
    },
    placeholder: {
      type: String,
      default: '请选择日期'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleChange(date, dateString) {
      this.$emit('update:modelValue', dateString)
    }
  }
}
</script>
