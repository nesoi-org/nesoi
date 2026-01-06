
import { Element } from './element';

export class MachineElement extends Element<$Machine> {

    protected prepare() {
        this.schema['#auth'] = Element.Never;
        this.schema['#input'] = Element.Never;
        this.schema['#output'] = Element.Never;
        this.schema['#data'] = Element.Never;
        this.prepareStates(this.schema.states);
        this.prepareTransitions(this.schema.transitions.from);
        this.prepareTransitions(this.schema.transitions.to);
    }

    private prepareStates(fields: $MachineStates) {
        Object.values(fields).forEach(field => {
            field['#auth'] = Element.Never;
            field['#input'] = Element.Never;
            field['#input.enter'] = Element.Never;
            field['#input.leave'] = Element.Never;
            field['#output'] = Element.Never;
        });
    }

    private prepareTransitions(ofStates: $MachineTransitions['from'|'to']) {
        Object.values(ofStates).forEach(ofMsgs => {
            Object.values(ofMsgs).forEach(transitions => {
                Object.values(transitions).forEach(transition => {
                    transition['#auth'] = Element.Never;
                    transition['#input'] = Element.Never;
                    transition['#output'] = Element.Never;
                })
            })
        });
    }

    public buildInterfaces() {
        this.interface.extends('$Machine')        
    }

    // private buildStatesType(states: $MachineStates) {
    //     const type = {} as ObjTypeAsObj;
    //     Object.entries(states).forEach(([key, state]) => {
    //         type[key] = DumpHelpers.dumpValueToType(state);
    //         Object.assign(type[key], {
    //             jobs: {
    //                 beforeEnter: type[key].jobs.beforeEnter ?? 'undefined',
    //                 afterEnter: type[key].jobs.afterEnter ?? 'undefined',
    //                 beforeLeave: type[key].jobs.beforeLeave ?? 'undefined',
    //                 afterLeave: type[key].jobs.afterLeave ?? 'undefined'
    //             },
    //             '#auth': Element.makeAuthnType(state.auth),
    //             '#input': Element.makeIOType(this.compiler, state).input,
    //             '#input.enter': Element.makeIOType(this.compiler, { input: state.inputEnter, output: 'never' } as any).input,
    //             '#input.leave': Element.makeIOType(this.compiler, { input: state.inputLeave, output: 'never' } as any).input,
    //             '#output': 'never',
    //         })
    //     })
    //     return type;
    // }

    // private buildTransitionsType(transitions: $MachineTransitions['from'|'to']) {
    //     const type = {} as ObjTypeAsObj;
    //     Object.entries(transitions).forEach(([state, stateTransitions]) => {
    //         type[state] = {}
    //         Object.entries(stateTransitions).forEach(([msg, msgTransitions]) => {
    //             type[state][msg] = []
    //             Object.values(msgTransitions).forEach(transition => {
    //                 const t = DumpHelpers.dumpValueToType(transition, undefined, undefined, 4);
    //                 Object.assign(t, {
    //                     '#auth': Element.makeAuthnType(transition.auth),
    //                     '#input': Element.makeIOType(this.compiler, transition).input,
    //                     '#output': 'never',
    //                 })
    //                 type[state][msg].push(t);
    //             })
    //             type[state][msg] = '[' + type[state][msg].map((v: any) => 
    //                 DumpHelpers.dumpType(v, undefined, 4)
    //             ).join(', ') + ']';
    //         })
    //     })
    //     return type;
    // }

}