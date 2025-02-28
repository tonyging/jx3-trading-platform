// src/components/__tests__/HelloWorld.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HelloWorld from '../HelloWorld.vue'; // 確保路徑正確
describe('HelloWorld', () => {
    it('renders properly', () => {
        const wrapper = mount(HelloWorld, { props: { msg: 'Hello Vitest' } });
        expect(wrapper.text()).toContain('Hello Vitest');
    });
});
//# sourceMappingURL=HelloWorld.spec.js.map