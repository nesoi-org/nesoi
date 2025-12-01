import type { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder'

import { expectMessage } from '../../tools/joaquin/message'
import { NesoiError } from '~/engine/data/error'
import { Log } from '~/engine/util/log'
import { NesoiDate } from '~/engine/data/date'
import { Mock } from './mock';
import { NesoiDatetime } from '~/engine/data/datetime'
import { NesoiDuration } from '~/engine/data/duration'
import { MessageBuilder } from '~/elements/entities/message/message.builder'

Log.level = 'off';

describe('Message', () => {

    describe('Any', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.any.as('Any Field')
        })

        it('any, boolean value', async() => {
            await expectMessage(template)
                .toParse({ value: Mock.Bool })
                .as({ value: Mock.Bool })
        })

        it('any, string value', async () => {
            await expectMessage(template)
                .toParse({ value: Mock.String })
                .as({ value: Mock.String })
        })
    
        it('any, number value', async () => {
            await expectMessage(template)
                .toParse({ value: Mock.Int })
                .as({ value: Mock.Int })
        })
    
        it('any, list value', async () => {
            await expectMessage(template)
                .toParse({ value: Mock.List })
                .as({ value: Mock.List })
        })

        it('any, obj value', async () => {
            await expectMessage(template)
                .toParse({ value: Mock.Obj })
                .as({ value: Mock.Obj })
        })

        it('any, function value', async () => {
            await expectMessage(template)
                .toParse({ value: Mock.Fn })
                .butFail(NesoiError.Message.UnsanitaryValue)
        })
    })

    describe('Boolean', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.boolean.as('Boolean Field')
        })

        it('boolean, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: Mock.Bool })
                .as({ value: Mock.Bool })
        })

        it('boolean, invalid value', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.String },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('boolean, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Date', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.date.as('Date Field')
        })

        it('date, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: '2000-10-31T01:30:00.000-05:00' })
                .as({ value: NesoiDate.fromISO('2000-10-31T01:30:00.000-05:00') })
        })

        it('date, invalid type', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.Bool },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('date, invalid value', async() => {
            await expectMessage(template)
                .toParse({
                    value: 'not_a_iso_string'
                })
                .butFail(NesoiError.Data.InvalidISOString)
        })

        it('date, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Datetime', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.datetime.as('Datetime Field')
        })

        it('datetime, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: '2000-10-31T01:30:00.000-05:00' })
                .as({ value: NesoiDatetime.fromISO('2000-10-31T01:30:00.000-05:00') })
        })

        it('datetime, invalid type', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.Bool },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('datetime, invalid value', async() => {
            await expectMessage(template)
                .toParse({
                    value: 'not_a_iso_string'
                })
                .butFail(NesoiError.Data.InvalidISOString)
        })

        it('datetime, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Duration', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.duration.as('Duration Field')
        })

        it('duration, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: '15 hours' })
                .as({ value: NesoiDuration.fromString('15 hours') })
        })

        it('duration, invalid type', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.Bool },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('duration, invalid value', async() => {
            await expectMessage(template)
                .toParse({
                    value: 'not_a_duration_string'
                })
                .butFail(NesoiError.Data.InvalidDuration)
        })

        it('duration, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Decimal', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.decimal().as('Decimal Field')
        })

        it('decimal, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: Mock.DecimalStr })
                .as({ value: Mock.Decimal })
        })

        it('decimal, invalid type', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.Bool },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('decimal, invalid value', async() => {
            await expectMessage(template)
                .toParse({
                    value: 'not_a_decimal'
                })
                .butFail(NesoiError.Data.InvalidDecimalValue)
        })

        it('decimal, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Literal', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.literal<'some_value'>(/some_value/).as('Literal Field')
        })

        it('literal, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: 'some_value' })
                .as({ value: 'some_value' })
        })

        it('literal, invalid type', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.Bool },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('literal, invalid value', async() => {
            await expectMessage(template)
                .toParse({
                    value: 'other_value'
                })
                .butFail(NesoiError.Message.InvalidLiteral)
        })

        it('literal, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Enum', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.enum(['red', 'green', 'blue']).as('Enum Field')
        })

        it('enum, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: 'red' })
                .as({ value: 'red' })
        })

        it('enum, invalid type', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.Bool },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('enum, invalid value', async() => {
            await expectMessage(template)
                .toParse({
                    value: 'white'
                })
                .butFail(NesoiError.Message.InvalidFieldEnumValue)
        })

        it('enum, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Msg', () => {

        const peerMsg = new MessageBuilder('test', 'peer')
        peerMsg.template($ => ({
            peerValue: $.int
        }));

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.msg('peer', {}).as('Msg Field')
        })

        it('msg, valid value', async() => {
            await expectMessage(template, [peerMsg])
                .toParse({
                    value: {
                        peerValue: 3
                    }
                })
                .as({
                    value: {
                        peerValue: 3
                    }
                })
        })

        it('msg, invalid type', async() => {
            await expectMessage(template, [peerMsg])
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.Bool }
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('msg, invalid type on msg', async() => {
            await expectMessage(template, [peerMsg])
                .toParse({
                    value: {
                        peerValue: 'wrong'
                    }
                })
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('msg, required', async() => {
            await expectMessage(template, [peerMsg])
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Simple Dict', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.dict($.int).as('Integer Dict')
        })

        it('Record<string, int>, valid value', async() => {
            await expectMessage(template)
                .toParse({ value: { a: Mock.Int, b: Mock.Int } })
                .as({ value: { a: Mock.Int, b: Mock.Int } })
        })

        it('Record<string, int>, invalid value', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.String },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('Record<string, int>, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Simple List', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.list($.int).as('Integer List')
        })

        it('int[], valid value', async() => {
            await expectMessage(template)
                .toParse({ value: [Mock.Int,Mock.Int] })
                .as({ value: [Mock.Int,Mock.Int] })
        })

        it('int[], invalid value', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.Int },
                    { value: Mock.Float },
                    { value: Mock.String },
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.InvalidFieldType)
        })

        it('int[], required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })

    describe('Simple Union', () => {

        const template: MessageTemplateDef<any, any, any> = $ => ({
            value: $.union($.int, $.string).as('Integer or String')
        })

        it('int|string, valid value 1', async() => {
            await expectMessage(template)
                .toParse({ value: Mock.Int })
                .as({ value: Mock.Int })
        })

        it('int|string, valid value 2', async() => {
            await expectMessage(template)
                .toParse({ value: Mock.String })
                .as({ value: Mock.String })
        })

        it('int|string, invalid value', async() => {
            await expectMessage(template)
                .toParseAll([
                    { value: Mock.List },
                    { value: Mock.Obj },
                ])
                .butFail(NesoiError.Message.ValueDoesntMatchUnion)
        })

        it('int|string, required', async() => {
            await expectMessage(template)
                .toParseAll([
                    { },
                    { value: null },
                    { value: undefined },
                    { value: '' },
                ])
                .butFail(NesoiError.Message.FieldIsRequired)
        })
    })
})