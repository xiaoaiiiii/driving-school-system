<template>
  <div class="fo-er">
    <div
      class="fo-label"
      :style="{ width: (100 / ($props.col || 1)) * (it.colSpan || 1) + '%' }"
      v-for="(it, key) in formData"
      v-show="!it.hidden"
      :key="key"
    >
      <span class="fo-span" :data-required="it.required" :style="{ flex: it.flex?.[0] }"
        >{{ it.label }}&nbsp;</span
      >
      <template v-if="!it.colonHide">：</template>
      <slot :name="key" v-if="$slots?.[key]" :it="it"></slot>
      <component
        :key="key"
        v-else
        :style="{ flex: it.flex?.[1] }"
        :is="it.is"
        :class="it.class"
        :modelValue="it.value"
        :list="it.list"
        :disabled="it.disabled"
        :clearable="it.clearable"
        :maxlength="it.maxlength"
        :filterable="it.filterable"
        :icon="it.icon"
        :taggable="it.taggable"
        :multiple="it.multiple"
        :options="it.options"
        :help="it.help"
        :min="it.min"
        :max="it.max"
        :range="it.range"
        :step="it.step"
        :loading="it.loading"
        :placeholder="it.placeholder"
        :scrollLoad="it.scrollLoad"
        :hidden="it.hidden"
        :search="it.search"
        :maxTagCount="it.maxTagCount"
        :maxTagTextLength="it.maxTagTextLength"
        @click="updateForm(key, it)"
        @update:modelValue="value => onFiledChange(key, value)"
      />
    </div>
  </div>
</template>

<script>
import InputText from './components/InputText.vue'
import Select from './components/Select.vue'
import DatePicker from './components/DatePicker.vue'

export default {
  components: {
    InputText,
    Select,
    DatePicker,
  },
}
</script>

<script setup>
import { toRefs } from 'vue'

const props = defineProps(['col', 'formData'])
const emit = defineEmits([
  'submit',
  'update:formData',
  'change',
  'input',
  'updateForm',
])

function onFiledChange(key, value) {
  emit('change', key, value, props.formData)
  emit('input', key, value, props.formData)
  const v = {
    ...toRefs(props.formData),
    [key]: {
      ...toRefs(props.formData[key]),
      value,
    },
  }
  emit('update:formData', v)
}
function updateForm(key, value) {
  emit('updateForm', key, value, props.formData)
}
</script>

<style lang="less" scoped>
.fo-er {
  margin-bottom: -8px;
}
.fo-label {
  display: inline-flex;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 32px;
  margin-bottom: 8px;
}
.fo-span {
  text-align: right;
  white-space: nowrap;
  text-indent: 0.5em;
  &[data-required='true']::before {
    content: '*';
    color: #f06141;
    margin: 0 4px;
  }
}
</style>
