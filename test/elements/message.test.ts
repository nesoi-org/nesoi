import { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder'
import { expectMessage } from '../../tools/joaquin/message'
import { NesoiError } from '~/engine/data/error'
import { Log } from '~/engine/util/log'
import { NesoiDate } from '~/engine/data/date'
import { Mock } from './mock';
import { NesoiDatetime } from '~/engine/data/datetime'

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
})