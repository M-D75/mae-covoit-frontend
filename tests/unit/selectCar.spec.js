import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { defineComponent, reactive, computed } from 'vue';
import { mapState, mapActions } from 'vuex';
import { parse, compileTemplate } from '@vue/compiler-sfc';

const filename = 'src/components/publish/SelectCar.vue';
const { descriptor } = parse(readFileSync(filename, 'utf8'));
const script = descriptor.script.content.replace(/^\s*import .*;$/gm, '').replace('export default', 'return');
const component = new Function('defineComponent', 'mapState', 'mapActions', script)(defineComponent, mapState, mapActions);
function setup(cars = []) {
    const vm = reactive({ ...component.data(), cars, getCars: vi.fn().mockResolvedValue({ status: 0 }), $emit: vi.fn() });
    for (const [key, method] of Object.entries(component.methods)) {
        if (key !== 'getCars') vm[key] = method.bind(vm);
    }
    const infos = computed(() => component.computed.infos.call(vm));
    Object.defineProperty(vm, 'infos', { get: () => infos.value });
    return vm;
}

describe('publication vehicle selection', () => {
    it('compiles the vehicle list template', () => {
        expect(compileTemplate({ source: descriptor.template.content, filename, id: 'select-car' }).errors).toEqual([]);
    });
    it('refreshes plates and passes the real selected car id and capacity to publication', async () => {
        const vm = setup([{ id: 82, license_plate: 'OLD', seats: 3, model: 'SUV' }]);
        vm.getCars.mockImplementation(async () => {
            vm.cars = [{ id: 82, license_plate: 'NEW-123', seats: 3, model: 'SUV', color: 'blue' }];
            return { status: 0 };
        });
        await vm.loadCars();
        expect(vm.getCars).toHaveBeenCalledOnce();
        expect(vm.infos[0]).toMatchObject({ model: 'NEW-123', id: 82, seats: 3, color: 'blue' });
        vm.selectCar(vm.infos[0]);
        expect(vm.car).toBe(82);
        expect(vm.seats).toBe(3);
        expect(vm.$emit).toHaveBeenCalledWith('car-selected');
    });
    it('offers all owned vehicles and tolerates an unknown vehicle model', async () => {
        const vm = setup(Array.from({ length: 8 }, (_, id) => ({ id: id + 10, license_plate: `CAR-${id}`, model: 'UNKNOWN', seats: 4 })));
        await vm.loadCars();
        expect(vm.infos).toHaveLength(8);
        expect(vm.infos[7].icon).toBe('mdi-car');
        vm.selectCar(vm.infos[7]);
        expect(vm.car).toBe(17);
        vm.selectCar({ id: 999, seats: 4 });
        expect(vm.car).toBe(17);
    });
    it('does not expose cached vehicles during loading or after an error and can retry', async () => {
        const vm = setup([{ id: 1, license_plate: 'CACHED', seats: 4 }]);
        expect(vm.infos).toEqual([]);
        vm.getCars.mockResolvedValueOnce({ status: 1, message: 'Erreur réseau' });
        await vm.loadCars();
        expect(vm.error).toBe('Erreur réseau');
        expect(vm.infos).toEqual([]);
        vm.selectCar({ id: 1, seats: 4 });
        expect(vm.$emit).not.toHaveBeenCalled();
        await vm.loadCars();
        expect(vm.error).toBe('');
        expect(vm.infos).toHaveLength(1);
    });
    it('handles an empty garage and unexpected request failure without selecting a default car', async () => {
        const vm = setup();
        await vm.loadCars();
        expect(vm.infos).toEqual([]);
        expect(vm.car).toBeNull();
        vm.getCars.mockRejectedValueOnce(new Error('offline'));
        await vm.loadCars();
        expect(vm.loading).toBe(false);
        expect(vm.error).toContain('Impossible');
        expect(vm.car).toBeNull();
    });
});
