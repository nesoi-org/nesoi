import { Log } from '~/engine/util/log';
import { CompilerTest } from './compiler_test';

describe('Bucket Compiler', () => {
   
    describe('Schemas', () => {
        
        it('simple bucket', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'    prop: $.string\n'
                    +'  }))\n'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.bucket()

                expect(schema).toEqual({
                    '$t': 'bucket',
                    '#data': undefined,
                    '#composition': undefined,
                    '#modelpath': undefined,
                    '#querypath': undefined,
                    '#defaults': undefined,

                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    model: {
                        '$t': 'bucket.model',
                        fields: {
                            'id': expect.anything(),
                            'prop': expect.anything()
                        },
                        defaults: {
                            'id': undefined,
                            'prop': undefined
                        },
                        hasFileField: false,
                        hasEncryptedField: false,
                    },
                    graph: {
                        '$t': 'bucket.graph',
                        links: {}
                    },
                    views: {
                        'default': expect.anything()
                    },
                    tenancy: undefined,
                    extendsFrom: undefined,
                })
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
    })

    describe('TypeScript Bridge', () => {

        it('tenancy', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .tenancy({\n'
                    +'    \'api1\': user => ({ id: 1 } as never),\n'
                    +'    \'api2\': user => ({ id: 1 } as never)\n'
                    +'  })\n'
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'    prop: $.string\n'
                    +'  }))\n'
                );
    
                await compiler.compile()

                const testBucket = await compiler.schema_file.bucket();
                expect(testBucket).not.toContain('TS BRIDGE WARN');
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('[view] computed', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'    prop: $.list($.string)\n'
                    +'  }))\n'
                    +'  .view(\'default\', $ => ({\n'
                    +'    c1: $.computed($ => $.value + \'c1\'),\n'                                 // computed
                    +'    c2: $.model(\'prop\').chain($ => $.computed($ => $.value + \'c2\')),\n'   // chain -> computed
                    +'    c3: $.model(\'prop\').obj($ => ({\n'                                      // obj -> computed
                    +'      d1: $.computed($ => $.value + \'c3\')\n'
                    +'    })),\n'
                    +'    c4: $.model(\'prop\').as_dict()\n'                                // {op} -> chain -> computed
                    +'      .chain($ => $.computed($ => $.value + \'c4\')),\n'
                    +'    c5: $.model(\'prop\').as_dict().pick(0)\n'                        // {op} -> {op} -> chain -> computed
                    +'      .chain($ => $.computed($ => $.value + \'c5\')),\n'
                    +'    c6: $.model(\'prop\').as_dict()\n'                                // {op} -> chain -> {op} -> computed -> {op} -> obj -> computed
                    +'      .chain($ => $.computed($ => ({ a: $.value + \'c6.0\' })).as_list()\n'
                    +'        .obj($ => ({\n'
                    +'          d2: $.computed($ => $.value + \'c6.1\')\n'
                    +'        }))\n'
                    +'      ),\n'
                    +'    c7: $.model(\'prop\')\n'                                  // (chain -> computed) -> {op} -> (obj -> computed)
                    +'      .chain($ => $.computed($ => [$.value + \'c7.0\']))\n'
                    +'      .as_dict()\n'
                    +'      .obj($ => ({ d3: $.computed($ => $.value + \'c7.1\') })),\n'
                    +'    c8: $.model(\'prop.*\')\n'                                // model with spread -> chain -> computed
                    +'      .chain($ => $.computed($ => $.value + \'c8\')),\n'
                    +'    c9: $.model(\'prop.*\')\n'                                // model with spread -> chain -> computed
                    +'      .chain($ => $.model(\'prop.*\')\n'
                    +'        .chain($ => $.computed($ => $.value + \'c9\'))\n'
                    +'       ),\n'
                    +'    c10: $.obj({\n'                                           // obj -> model with spread -> chain -> computed
                    +'      a: $.model(\'prop.*\').chain($ =>\n'
                    +'        $.computed($ => $.value + \'c10\')\n'
                    +'      ),\n'
                    +'    })\n'
                    +'  }))\n'
                );
    
                await compiler.compile()

                const testBucket = await compiler.schema_file.bucket();
                expect(testBucket).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('[view] transform', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'    prop: $.list($.string)\n'
                    +'  }))\n'
                    +'  .view(\'default\', $ => ({\n'
                    +'    c1: $.model(\'prop\').transform($ => 1),\n'                 // transform
                    +'    c2: $.model(\'prop\').map($ => $.transform($ => 2)),\n'     // map -> transform
                    +'    c3: $.obj({\n'                                              // obj -> transform
                    +'      d1: $.model(\'prop\').transform($ => 3)\n'
                    +'    }),\n'
                    +'    c4: $.model(\'prop\').as_dict()\n'                          // {op} -> chain -> transform
                    +'      .chain($ => $.model(\'prop\').transform($ => 4)),\n'
                    +'    c5: $.model(\'prop\').as_dict().pick(0)\n'                  // {op} -> {op} -> chain -> transform
                    +'      .chain($ => $.model(\'prop\').transform($ => 5)),\n'
                    +'    c6: $.model(\'prop\').as_dict()\n'                          // {op} -> chain -> {op} -> transform -> {op} -> obj -> transform
                    +'      .chain($ => $.model(\'prop\').transform($ => ({ a: \'6.0\' })).as_list()\n'
                    +'        .obj($ => ({\n'
                    +'          d2: $.model(\'prop\').transform($ => \'6.1\')\n'
                    +'        }))\n'
                    +'      ),\n'
                    +'    c7: $.model(\'prop\')\n'                                    // (chain -> transform) -> {op} -> (obj -> transform)
                    +'      .chain($ => $.model(\'prop\').transform($ => [\'7.0\']))\n'
                    +'      .as_dict()\n'
                    +'      .obj($ => ({ d3: $.model(\'prop\').transform($ => \'7.1\') })),\n'
                    +'    c8: $.model(\'prop.*\')\n'                                  // model with spread -> chain -> transform
                    +'      .chain($ => $.model(\'prop\').transform($ => 8)),\n'
                    +'    c9: $.model(\'prop.*\')\n'                                // model with spread -> chain -> transform
                    +'      .chain($ => $.model(\'prop.*\')\n'
                    +'        .chain($ => $.model(\'prop\').transform($ => 9))\n'
                    +'       ),\n'
                    +'    c10: $.obj({\n'                                           // obj -> model with spread -> chain -> transform
                    +'      a: $.model(\'prop.*\').chain($ =>\n'
                    +'        $.model(\'prop\').transform($ => 10)\n'
                    +'      ),\n'
                    +'    })\n'
                    +'  }))'
                );
    
                await compiler.compile()

                const testBucket = await compiler.schema_file.bucket();
                expect(testBucket).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
        it('[view] query params', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'  }))\n'
                , 'color');
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'    prop: $.list($.string)\n'
                    +'  }))\n'
                    +'  .view(\'default\', $ => ({\n'
                    +'    c1: $.query(\'one\', \'color\', {}, $ => ({ a: 1 })),\n'                      // query
                    +'    c2: $.model(\'prop\').chain($ => $.query(\'one\', \'color\', {}, $ => ({ a: 2 }))),\n'   // chain -> query
                    +'    c3: $.model(\'prop\').obj($ => ({\n'                                      // obj -> query
                    +'      d1: $.query(\'one\', \'color\', {}, $ => ({ a: 3 }))\n'
                    +'    })),\n'
                    +'    c4: $.model(\'prop\').as_dict()\n'                                // {op} -> chain -> query
                    +'      .chain($ => $.query(\'one\', \'color\', {}, $ => ({ a: 4 }))),\n'
                    +'    c5: $.model(\'prop\').as_dict().pick(0)\n'                        // {op} -> {op} -> chain -> query
                    +'      .chain($ => $.query(\'one\', \'color\', {}, $ => ({ a: 5 }))),\n'
                    +'    c6: $.model(\'prop\').as_dict()\n'                                // {op} -> chain -> {op} -> query -> {op} -> obj -> query
                    +'      .chain($ => $.query(\'many\', \'color\', {}, $ => ({ a: \'6.0\' })).as_dict()\n'
                    +'        .obj($ => ({\n'
                    +'          d2: $.query(\'one\', \'color\', {}, $ => ({ a: \'6.1\' }))\n'
                    +'        }))\n'
                    +'      ),\n'
                    +'    c7: $.model(\'prop\')\n'                                  // (chain -> query) -> {op} -> (obj -> query)
                    +'      .chain($ => $.query(\'many\', \'color\', {}, $ => ({ a: \'7.0\' })))\n'
                    +'      .as_dict()\n'
                    +'      .obj($ => ({ d3: $.query(\'one\', \'color\', {}, $ => ({ a: \'7.1\' })) })),\n'
                    +'    c8: $.model(\'prop.*\')\n'                                // model with spread -> chain -> query
                    +'      .chain($ => $.query(\'one\', \'color\', {}, $ => ({ a: 8 }))),\n'
                    +'    c9: $.model(\'prop.*\')\n'                                // model with spread -> chain -> query
                    +'      .chain($ => $.model(\'prop.*\')\n'
                    +'        .chain($ => $.query(\'one\', \'color\', {}, $ => ({ a: 9 })))\n'
                    +'       ),\n'
                    +'    c10: $.obj({\n'                                           // obj -> model with spread -> chain -> query
                    +'      a: $.model(\'prop.*\').chain($ =>\n'
                    +'        $.query(\'one\', \'color\', {}, $ => ({ a: 10 }))\n'
                    +'      ),\n'
                    +'    })\n'
                    +'  }))\n'
                );
    
                await compiler.compile()

                const testBucket = await compiler.schema_file.bucket();
                expect(testBucket).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
    })
})