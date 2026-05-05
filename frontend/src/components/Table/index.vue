<template>
  <div
    class="table-er"
    @scroll="onScroll"
    :data-x="isEmpty ? 0 : sticky.x"
    :data-y="isEmpty ? 0 : sticky.y"
    :style="{ overflow: isEmpty ? 'hidden' : '' }"
  >
    <table class="table">
      <tr class="table-head" v-show="$props.data?.length != 0">
        <template v-for="(col, row) in theColumns" :key="col.key">
          <th
            :data-sticky="col.sticky"
            :style="{
              width: col.width,
              '--width': col.width,
              '--after-sticky-width': col.afterStickyWidth,
              '--before-sticky-width': col.beforeStickyWidth,
            }"
          >
            <slot :name="col.key + '-header'" v-if="$slots?.[col.key + '-header']"></slot>
            <span v-else class="table-span">
              <span class="table-span-icon">
                {{ col.title }}
              </span>
            </span>
          </th>
        </template>
      </tr>

      <tr v-for="(item, i) in $props.data" :key="i" :class="item.class">
        <template v-for="(col, row) in theColumns" :key="col.key">
          <td
            :data-sticky="col.sticky"
            :style="{
              '--width': col.width,
              '--after-sticky-width': col.afterStickyWidth,
              '--before-sticky-width': col.beforeStickyWidth,
            }"
          >
            <slot :name="col.key" v-if="$slots?.[col.key]" :item="item" :index="i"> </slot>
            <span v-else class="table-span">{{ item[col.key] }}</span>
          </td>
        </template>
      </tr>
    </table>
    <Empty v-if="isEmpty" />
    <Spin v-if="$props.loading" />
  </div>
</template>

<script>
import Spin from '../Spin/index.vue'
import Empty from '../Empty/index.vue'
export default {
  components: { Spin, Empty },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      required: false,
    },
  },
  computed: {
    isEmpty() {
      return !this.$props.loading && !this.$props.data?.length
    },
    theColumns() {
      let t = {}
      let row = 0
      for (let k in this.columns) {
        t[k] = {
          ...this.columns[k],
          beforeStickyWidth:
            'calc(' +
            (this.columns
              .filter((v, i) => i < row && v.sticky == 'left')
              .map(v => v.width)
              .join(' + ') || '0px') +
            ')',
          afterStickyWidth:
            'calc(' +
            (this.columns
              .filter((v, i) => i > row && v.sticky == 'right')
              .map(v => v.width)
              .join(' + ') || '0px') +
            ')',
        }
        row++
      }
      return t
    },
  },
  data() {
    return {
      sticky: { x: 'left', y: 'top' },
    }
  },
  methods: {
    onScroll(e) {
      let { scrollTop, scrollLeft, clientWidth, clientHeight, scrollWidth, scrollHeight } = e.target
      this.sticky.x =
        scrollLeft == 0 ? 'left' : clientWidth + scrollLeft == scrollWidth ? 'right' : undefined
      this.sticky.y =
        scrollTop == 0 ? 'top' : clientHeight + scrollTop == scrollHeight ? 'bottom' : undefined
    },
  },
}
</script>

<style lang="less" scoped>
.table-er {
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  position: relative;
  border-radius: 5px;
  &[data-x='right'] {
    [data-sticky='right']::after {
      display: none;
    }
  }
  &[data-x='left'] {
    [data-sticky='left']::after {
      display: none;
    }
  }
}
.table {
  width: 100%;
  color: #333;
  border-collapse: collapse;
  background-color: #fff;
  tr {
    background-color: #fff;
    &:hover {
      background-color: #f9f9f9;
    }
  }

  tr + tr {
    border-bottom: 1px solid #e8e8e8;
  }

  th,
  td {
    text-align: left;
    text-indent: 0.5em;
    padding: 0;
    height: 38px;
    background-color: inherit;
    white-space: nowrap;
    box-sizing: border-box;
    position: relative;
    &[data-sticky='right'] {
      position: sticky;
      right: var(--after-sticky-width);
      &::after {
        content: '';
        display: block;
        position: absolute;
        left: -9px;
        top: 0;
        height: 100%;
        width: 9px;
        background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.043));
        pointer-events: none;
      }
      & ~ [data-sticky='right']::after {
        display: none;
      }
    }
    &[data-sticky='left'] {
      position: sticky;
      left: var(--before-stickyWidth);
      z-index: 1;
      &::after {
        content: '';
        display: block;
        position: absolute;
        right: -9px;
        top: 0;
        height: 100%;
        width: 9px;
        background: linear-gradient(to left, transparent, rgba(0, 0, 0, 0.043));
        pointer-events: none;
      }
    }
  }

  th {
    background: #fafafa;
    position: sticky;
    top: 0;
    z-index: 1 !important;
    &::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      border-top: 1px solid #e8e8e8;
    }
    &[data-sticky] {
      z-index: 2 !important;
    }
  }
}
.table-span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: var(--width);
}
.table-span-icon {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
</style>
