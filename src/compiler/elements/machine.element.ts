import { ObjTypeAsObj } from '~/engine/util/type';
import { $Machine, $MachineStates, $MachineTransitions } from '~/elements/blocks/machine/machine.schema';
import { DumpHelpers } from '../helpers/dump_helpers';
import { NameHelpers } from '~/engine/util/name_helpers';
import { Element } from './element';

export class MachineElement extends Element<$Machine> {

    protected prepare() {
        this.schema['#authn'] = Element.Any;
        this.schema['#input'] = this.schema.input.length ? Element.Any : Element.Never;
        this.schema['#output'] = Element.Never;
        this.schema['#data'] = Element.Any;
        this.prepareStates(this.schema.states);
        this.prepareTransitions(this.schema.transitions.from);
        this.prepareTransitions(this.schema.transitions.to);
    }

    private prepareStates(fields: $MachineStates) {
        Object.values(fields).forEach(field => {
            field['#authn'] = Element.Any;
            field['#input'] = field.input.length ? Element.Any : Element.Never;
            field['#input.enter'] = field.inputEnter.length ? Element.Any : Element.Never;
            field['#input.leave'] = field.inputLeave.length ? Element.Any : Element.Never;
            field['#output'] = Element.Never;
        });
    }

    private prepareTransitions(ofStates: $MachineTransitions['from'|'to']) {
        Object.values(ofStates).forEach(ofMsgs => {
            Object.values(ofMsgs).forEach(transitions => {
                Object.values(transitions).forEach(transition => {
                    transition['#authn'] = Element.Any;
                    transition['#input'] = transition.input.length ? Element.Any : Element.Never;
                    transition['#output'] = Element.Never;
                })
            })
        });
    }

    protected buildType() {
        const type = DumpHelpers.dumpValueToType(this.schema, {
            states: v => this.buildStatesType(v),
            transitions: {
                from: v => this.buildTransitionsType(v),
                to: v => this.buildTransitionsType(v)
            }
        })

        const data = this.schema.buckets.map(bucket => {
            // const schema = bucket.resolve(this.compiler.tree);
            return NameHelpers.tagType(bucket, this.module) + '[\'#data\']';
        });

        Object.assign(type, {
            '#authn': Element.makeAuthnType(this.schema.auth),
            '#input': Element.makeIOType(this.compiler, this.schema).input,
            '#output': 'never',
            '#data': data,
        });
        return type
    }

    private buildStatesType(states: $MachineStates) {
        const type = {} as ObjTypeAsObj;
        Object.entries(states).forEach(([key, state]) => {
            type[key] = DumpHelpers.dumpValueToType(state);
            Object.assign(type[key], {
                jobs: {
                    beforeEnter: type[key].jobs.beforeEnter ?? 'undefined',
                    afterEnter: type[key].jobs.afterEnter ?? 'undefined',
                    beforeLeave: type[key].jobs.beforeLeave ?? 'undefined',
                    afterLeave: type[key].jobs.afterLeave ?? 'undefined'
                },
                '#authn': Element.makeAuthnType(state.auth),
                '#input': Element.makeIOType(this.compiler, state).input,
                '#input.enter': Element.makeIOType(this.compiler, { input: state.inputEnter, output: 'never' } as any).input,
                '#input.leave': Element.makeIOType(this.compiler, { input: state.inputLeave, output: 'never' } as any).input,
                '#output': 'never',
            })
        })
        return type;
    }

    private buildTransitionsType(transitions: $MachineTransitions['from'|'to']) {
        const type = {} as ObjTypeAsObj;
        Object.entries(transitions).forEach(([state, stateTransitions]) => {
            type[state] = {}
            Object.entries(stateTransitions).forEach(([msg, msgTransitions]) => {
                type[state][msg] = []
                Object.values(msgTransitions).forEach(transition => {
                    const t = DumpHelpers.dumpValueToType(transition, undefined, undefined, 4);
                    Object.assign(t, {
                        '#authn': Element.makeAuthnType(transition.auth),
                        '#input': Element.makeIOType(this.compiler, transition).input,
                        '#output': 'never',
                    })
                    type[state][msg].push(t);
                })
                type[state][msg] = '[' + type[state][msg].map((v: any) => 
                    DumpHelpers.dumpType(v, undefined, 4)
                ).join(', ') + ']';
            })
        })
        return type;
    }

}