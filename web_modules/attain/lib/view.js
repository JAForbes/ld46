import m from '../../mithril.js';
import '../../common/_commonjsHelpers-f5462f22.js';
import bss from '../../bss.js';
import stream$1 from '../../mithril-stream.js';

/* globals Symbol */

const run = (initial, ...fns) => {
    if( fns.length == 0){
        throw new Error(
            'You must provide an initial value and a non-empty spread of functions.'
        )
    }
    return fns.reduce( (p, f) => f(p), initial )
};

const otherwise = tagNames => f =>
    tagNames.reduce(
        (p,k) => Object.assign(p, { [k]: f }), {}
    );

const _fold = () =>
    fns => M => fns[M.tag](M.value);

const pipe = (...fns) => {
    if( fns.length == 0){
        throw new Error(
            'You must provide a non-empty spread of functions.'
        )
    }
    return initial => run(initial, ...fns)
};

const repeat = (n,x) => Array(n).fill(x);
const repeatStr = (n,x) => n > 0 ? repeat(n,x).join('') : '';

function annotate(visitor, value){
  const notPrimative = Object(value) === value;
  const isNil = value == null;
  const isArray = notPrimative && Array.isArray(value);
  const isObject = notPrimative && !isArray;
  const isFunction = notPrimative && typeof value === 'function';
  const isPrimative = !notPrimative;
  const isStag = isObject && value.type && value.tag;
  const valueStag = isStag && 'value' in value;
  const emptyStag = isStag && !valueStag;
  const isPojo = isObject && value.constructor.name == 'Object';
  const isDate = isObject && value instanceof Date;
  const isError = isObject && value instanceof Error;
  const isString = typeof value === 'string';

  return visitor({
    notPrimative,
    isPrimative,
    isString,
    isNil,
    isArray,
    isObject,
    isPojo,
    isDate,
    isError,
    value,
    isFunction,
    isStag,
    valueStag,
    emptyStag
  })
}


const toString$1 = x =>
  annotate((function visitor(indentation){
    return (annotation) => {

      const {
        value
        , isPojo
        , isObject
        , isArray
        , isDate
        , isError
        , valueStag
        , emptyStag
        , isString
        , isFunction
      } = annotation;

      const indentChar = '';
      const tab = repeatStr(indentation, indentChar);
      const tabLess = repeatStr(indentation-1, indentChar);
      const tab2 = repeatStr(indentation+1, indentChar);
      const newLine = '';

      return (
        valueStag
          ? value.type+'.'+value.tag+'('
              + (typeof value.value === 'undefined'
                ? ''
                : annotate( visitor(indentation+1),  value.value ))
            + ( indentation > 0 ? newLine + tabLess : '' ) + newLine + tab + ')'
        : emptyStag
          ? value.type+'.'+value.tag+'()'
        : isPojo
          ? Object.keys(value).length == 0
            ? '{}'
            : run(
                value
                , Object.entries
                , xs => xs.map(
                    ([key, value]) =>
                        newLine + tab2 + '"' + key +'":'
                            + annotate(visitor(indentation+1), value)
                              .replace(newLine+tab2, '')
                )
                , strings => newLine+tab+'{' + strings + newLine + tab + '}'
            )
      : isArray
        ? value.length == '0'
          ? '[]'
          : newLine + tab + '['
              + newLine + tab + tab + value.map(
                x => annotate(visitor(indentation+1), x)
              )
              .join(', ')
          + newLine + tab + ']'
      : isDate
        ? 'new ' + value.constructor.name + '("'
          + value.toISOString()
        + '")'
      : isError
        ? 'new ' + value.constructor.name + '("'
          + value.message
        + '")'
      : isFunction
        ? value + ''
      : isObject
        ? 'new ' + value.constructor.name + '()'
      : isString
        ? JSON.stringify(value)
      : '' + value
    )
  }
})(0), x);

const toJSON = x =>
  annotate(function visitor({
    value, isPojo, isArray, valueStag, emptyStag
  }){
    const out = (
      valueStag
        ? annotate(visitor, value.value)
      : emptyStag
        ? null
      : isPojo
        ? fromEntries(
          Object.entries(value).map( value => annotate(visitor, value) )
        )
      : isArray
        ? value.map( value => annotate(visitor, value) )
      : value
    );

    return out
  }, x);

function boundToString(){
    return toString$1(this)
}

function typeName(instance){
    return instance.type
}

function tagName(instance){
    return instance.tag
}

const proto =
    { toString: boundToString
    , inspect: boundToString
    // , toJSON: boundToJSON
    , [Symbol.for('nodejs.util.inspect.custom')]: boundToString
    };

function valueInstance(type, tag, value){
    return Object.assign( Object.create(proto), {
        type,
        tag,
        value
    })
}

function emptyInstance(type, tag){
    return Object.assign( Object.create(proto), {
        type, tag
    })
}

const fromEntries = pairs =>
  pairs.reduce(
    (p, [k,v]) => ({ ...p, [k]: v }), {}
  );


const StaticSumTypeError =
  [ 'ExtraTags'
  , 'MissingTags'
  , 'InstanceNull'
  , 'InstanceWrongType'
  , 'InstanceShapeInvalid'
  , 'VisitorNotAFunction'
  , 'NotAType'
  , 'TagsShapeInvalid'
  ]
  .reduce(
      (p,n) => {
          p[n] = value => valueInstance(p.type, n, value);
          p.tags.push(n);
          return p
      }
      ,{
          type: 'StaticSumTypeError',
          tags: [],
          specs: {}
      }
  );

function getTags(T) {
  return T.tags
}

const ErrMessageTags =
  { ExtraTags: function ExtraTags(o) {
      return (
          ['Your tag function must have exactly the same'
              , ' keys as the type: ' + o.T.type + '. '
              , 'The following tags should not have been present:'
              , o.extraKeys.join(', ')
          ].join(' ')
      )
  }
  , MissingTags: function MissingTags(o) {
      return (
          [
              'Your tag function must have exactly the same'
              , 'keys as the type: ' + o.T.type + '. The following keys were'
              , 'missing:'
              , o.missingKeys.join(', ')
          ]
      )
          .join(' ')
  }

  , InstanceNull: function InstanceNull(o) {
      return (
          'Null is not a valid member of the type ' + o.T.type
      )
  }

  , InstanceWrongType: function InstanceWrongType(o) {
      return (
          [toString$1(o.x) + ' is not a valid member of the type'
              , o.T.type
              , 'which expects the following tags'
              , getTags(o.T).join(' | ')
          ]
      )
          .join(' ')
  }

  , InstanceShapeInvalid: function InstanceShapeInvalid(o) {
      return [
          toString$1(o.x)
          , 'is not a valid Member of the type:'
          , o.T.type + '. '
          , 'Please review the definition of ' + o.T.type
      ]
          .join(' ')
  }
  , VisitorNotAFunction: function (o) {
      return o.context + ' expected a visitor function '
          + ' but instead received ' + toString$1(o.visitor)
  }
  , NotAType: function (o) {
      return o.context + ' expected a Type ({ type: string, tags: string[] })'
          + ' but received ' + toString$1(o.T)
  }
  , TagsShapeInvalid(T, tags){
      return 'fold('+typeName(T)+') tags provided were not the right shape.  '
          + 'Expected { [tag]: f } but received ' + toString$1(tags)
  }
};

function foldT( getT ) {
  const T = getT();
  assertValidType('fold', T);
  return function devCata$T(tags) {
      assertValidCata(T, tags);

      const tagNames =
          Object.keys(tags);

      const tKeys =
          getTags(T);

      const xKeys = [
          [tagNames, T]
          , [tKeys, tags]
      ]
          .map(
              function (t) {
                  const xs = t[0];
                  const index = t[1];
                  return xs.filter(function (x) {
                      return !(x in index)
                  })
              }
          );

      const extraKeys = xKeys[0];
      const missingKeys = xKeys[1];

      if (missingKeys.length > 0) {
          return handleError(
              Err.MissingTags({ T: T, tags, missingKeys: missingKeys })
          )
      } else if (extraKeys.length > 0) {
          return handleError(
              Err.ExtraTags({ T: T, tags, extraKeys: extraKeys })
          )
      } else {
          return function (x) {

              return beforeFoldEval(T, tags, x)
                  && tags[tagName(x)](x.value)
          }
      }

  }
}


const errMessage = err =>
  _fold()(ErrMessageTags)(err);

function handleError(err) {
  const e = new Error(tagName(err) + ': ' + errMessage(err));
  throw e
}

const Err = StaticSumTypeError;

function assertValidType(context, T) {
  if (
      T == null
      ||
      !(
          T != null
          && typeof T.type == 'string'
          && Array.isArray(T.tags)
          && 'specs' in T
      )
  ) {
      return handleError(
          Err.NotAType({ context, T })
      )
  }
}

function assertValidVisitor(o) {
    if (typeof o.visitor != 'function') {
        return handleError(
            Err.VisitorNotAFunction({ context: o.context, visitor: o.visitor })
        )
    }
}

function assertValidTag(T, instance) {
    if (!(
        instance != null
        && typeName(instance) == T.type
        && getTags(T).includes(tagName(instance))
    )) {
        return handleError(
            Err.InstanceShapeInvalid({
                x: instance
                , T: T
            })
        )
    }
}

function assertValidCata(T, tags){
  if(
      tags != null
      && !Array.isArray(tags)
      && typeof tags === 'object'
  ) {
      return true
  } else {
      const err = Err.TagsShapeInvalid(T, tags);
      return handleError(
          err
      )
  }
}

function beforeFoldEval(T, tags, x){
  return x == null
      ? handleError(
          Err.InstanceNull({
              T: T, tags, x: x
          })
      )
  : typeName(x) !== T.type
      ? handleError(
          Err.InstanceWrongType({
              T: T, tags, x: x
          })
      )
  : !(getTags(T).includes(tagName(x)))
      ? handleError(
          Err.InstanceShapeInvalid({
              T: T, tags, x: x
          })
      )
      : true
}

function fold(T) {
  return foldT( () => T )
}


const mapAll = T => {
    const foldT = fold(T);

    return tags => {
        const foldTags = foldT(tags);
        return Ma => {
            assertValidTag(T, Ma);
            const value = foldTags(Ma);
            return T[tagName(Ma)](value)
        }
    }
};

const chainAll = T => {
    const foldT = fold(T);

    return tags => {
        const foldTags = foldT(tags);

        return Ma => {
            beforeFoldEval(
                T, tags, Ma
            );
            if( 'value' in Ma ){

                const nestedValue = foldTags(Ma);

                return beforeFoldEval(
                    T, tags, nestedValue
                )
                && nestedValue
            } else {
                return Ma
            }
        }
    }
};

const tags = (type, tagNames) => {
    return {
        type,
        specs: {},
        tags: tagNames,
        ...fromEntries(
            tagNames.map(
                tagName => [ tagName, (...args) =>
                    args.length
                        ? valueInstance(type, tagName, args[0])
                        : emptyInstance(type, tagName)
                ]
            )
        )
    }
};

function either(type){
    return tags(type, ['Y', 'N'])
}

const Either = either('stags.Either');

const all = T => Ms => {
    const bad = Ms.filter( M => !T.toBoolean (M) );

    if( bad.length > 0 ) {
        return T.left( bad.map( x => x.value ) )
    } else {
        return T.right( Ms.map( T.getOr( null) ) )
    }
};

const any = T => Ms =>
    Ms.some( T.toBoolean )
        ? T.right( Ms.filter( T.toBoolean ).map( T.getOr(null) ) )
        : Ms.find( M => !T.toBoolean(M) );

const _bifold = T => {
    const $fold = fold(T);
    const { left, right } = T.specs['stags/bifunctor'];

    return (leftF, rightF) =>
        $fold({ [left]: leftF, [right]: rightF })
};

const bifold = T => {
    assertValidType('bifold', T);

    return _bifold(T)
};

const _bimap = T => {
    const _mapAll = mapAll(T);
    const { left, right } = T.specs['stags/bifunctor'];

    return (leftF, rightF) =>
        _mapAll({
            [left]: leftF, [right]: rightF
        })
};

const bimap = T => {
    assertValidType('bimap', T);

    return _bimap(T)
};

const _getOr = T => or =>
    _bifold (T) (
        () => or, x => x
    );

const getOr = T => {
    assertValidType('getOr', T);

    return or => {
        return M => {
            assertValidTag(T, M);

            return _getOr (T) (or) (M)
        }
    }
};

const getWith = T => (otherwise, f) =>
    bifold(T) (
        () => otherwise, x => f(x)
    );

const tagBy = T => {
    fold(T); // just validates T
    return (otherwise, visitor) => a => {
        assertValidVisitor({ context: 'tagBy', visitor });
        return visitor(a) ? T.right(a) : T.left(otherwise)
    }
};

const toBoolean = T => T.bifold(
    () => false,
    () => true
);

const fromNullable = T => x =>
    x == null ? T.left(x) : T.right(x);

const encase = T => f => x => {
    try {
        return T.right(f(x))
    } catch (e) {
        return T.left(e)
    }
};


const _concatWith = T => f => A => B => {
    const { left, right } = T.specs['stags/bifunctor'];

    return (
        tagName(A) == left
            ? A
        : tagName(B) == left
            ? B
        : T[right](
            f ( A.value ) ( B.value )
        )
    )
};

const concatWith = T => {
    assertValidType('concatWith', T);

    return f => {
        assertValidVisitor({
            context: 'concatWith',
            visitor: f
        });


        return A => {
            assertValidTag(T, A);

            return B => {
                assertValidTag(T, B);
                return _concatWith (T) (f) (A) (B)
            }
        }
    }
};

const spec = ({ left, right }) => T => {
    T.specs['stags/bifunctor'] = { left, right };

    T.left = x => T[left](x);
    T.right = x => T[right](x);
    T.bifold = bifold(T);
    T.bimap = bimap(T);
    T.getOr = getOr(T);
    T.getWith = getWith(T);
    T.tagBy = tagBy(T);
    T.encase = encase(T);
    T.toBoolean = toBoolean(T);
    T.fromNullable = fromNullable(T);
    T.all = all(T);
    T.any = any(T);

    T.concatWith = concatWith(T);

    return T
};

const spec$1 = (tag) => T => {
    T.specs['stags/functor'] = tag;

    T.of = T[tag];
    T.map = T.map || (f => {
        assertValidVisitor({ context: 'map', visitor: f });
        return mapAll(T) ({
            ...otherwise(T.tags) ( x => x )
            ,[tag]: f
        })
    });

    return T
};

const spec$2 = (tag) => T => {
    T.specs['stags/monad'] = tag;

    T.of = T[tag];
    const chainAllT = chainAll(T);

    T.chain = f => {
        assertValidVisitor({ context: 'chain', visitor: f });

        return M => {
            return chainAllT({
                ...otherwise(T.tags) ( x => T[tagName(M)](x) )
                ,[tag]: x => f(x)
            }) (M)
        }
    };
    return T
};

function spec$3(T){
    if( T.specs['stags/decorated'] ){
        return T
    } else {
        // Do not expose this, they need to define their own _
        const _ = otherwise(getTags(T));

        const mapT = mapAll(T);
        const chainT = chainAll(T);
        const foldT = fold(T);

        getTags(T).forEach(
            k => {
                T['is'+k] = T['is'+k] || (M => {
                    assertValidTag(T, M);
                    return tagName(M) === k
                });

                T['map'+k] = T['map'+k] || (f => mapT({
                    ..._( x => x )
                    ,[k]: f
                }));

                T['get'+k+'Or'] = T['get'+k+'Or'] || (otherwise => foldT({
                    ..._( () => otherwise )
                    ,[k]: x => x
                }));

                T['get'+k+'With'] = T['get'+k+'With'] || ((otherwise, f) => foldT({
                    ..._( () => otherwise )
                    ,[k]: x => f(x)
                }));

                T['chain'+k] = T['chain'+k] || (f => x =>
                    chainT({
                        ..._( () => x )
                        ,[k]: f
                    }) (x));

                T['assert'+k] = T['assert'+k] || (foldT({
                    ..._( Either.N )
                    ,[k]: Either.Y
                }));

                T[k.toLowerCase()+'s'] = T[k+'s'] || (xs => xs.reduce(
                    (p,n) => p.concat(
                        T['is'+k](n) ? [n.value] : []
                    )
                    , []
                ));
            }
        );
        T.fold = T.fold || foldT;
        T.mapAll = T.mapAll || mapT;
        T.chainAll = T.chainAll || chainT;

        T.specs['stags/decorated'] = true;
        return T
    }
}

const externalEither = name => 
    run(
        either(name)
        ,spec$3
        ,spec({ left: 'N', right: 'Y' })
        ,spec$1('Y')
        ,spec$2('Y')
    );

const externalMaybe = name =>
    run(
        name
        ,externalEither
        ,x => {
            const oldN = x.N;
            x.N = () => oldN();
            x.specs['stags/maybe'] = true;
            return x
        }
    );

const externalTags = (type, tagNames) => 
    spec$3(tags(type, tagNames));

const decoratedEither = externalEither('stags.Either');

const { 
    Y
    , N
    , bifold: Ebifold
    , getOr: EgetOr
    , getWith: EgetWith
    , bimap: Ebimap
    , map: Emap
    , mapY: EmapY
    , mapN: EmapN
    , assertY: EassertY
    , assertN: EassertN
    , chainN: EchainN
    , chainY: EchainY
    , tagBy: EtagBy
    , chain: Echain
    , toBoolean: EtoBoolean
    , encase: Eencase
    , fromNullable: EfromNullable
    , all: Eall
    , any: Eany
    , isY: EisY
    , isN: EisN
    , ys: Eys
    , ns: Ens
    , concatWith: EconcatWith
} = decoratedEither;

const Valid = {
    name: 'Valid'
    ,type: 'Valid'
    ,specs: {}
    ,tags: ['Y', 'N']
    ,Y: value => ({ case: 'Y', tag: 'Y', type: 'Valid', value})
    ,N: value => ({ case: 'N', tag: 'N', type: 'Valid', value})
    ,bifold: (N,Y) => o => ({
        Y
        ,N
    })[o.tag](o.value)
    ,fold: ({ Y,N }) => o => ({ Y,N })[o.tag](o.value)
    ,map: f => o => ({
        Y: x => Valid.Y(f(x))
        ,N: () => o
    })[o.tag](o.value)
};

const PatternToken = {
    name: 'PatternToken'
    ,type: 'PatternToken'
    ,specs:{}
    ,tags: ['Path', 'Part']
    ,Path: value =>
        ({ case: 'Path', tag: 'Path', value, type: 'PatternToken' })
    ,Part: value =>
        ({ case: 'Part', tag: 'Part', value, type: 'PatternToken' })

    ,groupSpecificity: tokens => 
        tokens.map(URLToken.specificity)
            .reduce( (p,n) => p+n, 0)

    ,fold: ({
        Path,
        Part
    }) => o => ({
        Path
        ,Part
    })[o.tag](o.value)

    ,infer: segment =>
        segment.startsWith(':')
            ? PatternToken.Part(segment.slice(1))
            : PatternToken.Path(segment)

    ,groupValidations: {
        duplicateDef: allTokensPairs => {

            // Pair (CaseName, PatternStr)
            const patterns = 
                allTokensPairs.map(
                    ([k,v]) => [k, PatternToken.toPattern(v)]
                );
            
            // StrMap (PatternStr, CaseName[])
            const patternStrDupeSearch =
                patterns.reduce(
                    (p,[caseName,pattern]) => {
                        p[pattern] = p[pattern] || [];
                        p[pattern].push(caseName);
    
                        return p
                    }
                    , {}
                );
    
            // StrMap (CaseName, DupeMetaData)
            // where 
            // DupeMetaData = 
            //  { caseNames::CaseName[], patternStr::PatternStr }
            const caseDupes = 
                Object.entries(patternStrDupeSearch)
                    .reduce(
                        (p, [patternStr, caseNames]) => {

                            if( caseNames.length > 1 ){
                                caseNames.forEach(
                                    (caseName) => {
                                        p[caseName] = {
                                            caseNames, patternStr
                                        };
                                    }
                                );
                            }
                            return p
                        }
                        ,{}
                    );

            if ( Object.keys(caseDupes).length ){
                return Valid.N(
                    // StrMap (CaseName, PatternToken.Error )
                    Object.entries(caseDupes)
                        .map(
                            ([caseName, { caseNames, patternStr }]) => 
                                [ caseName
                                , PatternToken.Error.DuplicateDef({
                                    caseNames, patternStr
                                })
                                ]
                        )
                )
            } else {
                return Valid.Y(
                    allTokensPairs
                )
            }
        }
    }

    ,singleValidations: {

        duplicatePart: tokens => {
            
            const dupeParts =
                [
                    tokens.flatMap(
                        PatternToken.fold({
                            Path: () => []
                            ,Part: x => [x]
                        })
                    )
                    .reduce(
                        (p,n) => {
                            p[n] = p[n] || 0;
                            p[n] = p[n] + 1;
                            return p
                        }
                        ,{}
                    )
                ]
                .flatMap( 
                    o => Object.entries(o)
                        .flatMap( ([k,v]) => v > 1 ? [k] : [])
                );

            if (dupeParts.length) {
                return Valid.N(
                    PatternToken.Error.DuplicatePart({
                        dupeParts
                    })
                )
            } else {
                return Valid.Y(tokens)
            }
        }
    }

    ,Error: {
        name: 'PatternToken.Error'
        ,type: 'PatternToken.Error'
        ,tags: 
            [ 'DuplicateDef'
            , 'DuplicatePart'
            ]
        ,specs: {}

        ,DuplicateDef({ caseNames, patternStr }){
            return {
                type: 'PatternToken.Error'
                ,case: 'DuplicateDef'
                ,tag: 'DuplicateDef'
                ,value: new TypeError(
                    'Found duplicate pattern definitions for '
                    + 'routes: '+caseNames.join(', ')+'.  '
                    + 'They all have equivalent pattern strings: '
                    + patternStr + '.  '
                    + 'Duplicated patterns lead to ambiguous matches.'
                )
            }
        }

        ,DuplicatePart({ dupeParts }){
            return {
                type: 'PatternToken.Error'
                ,case: 'DuplicatePart'
                ,tag: 'DuplicatePart'
                ,value: new TypeError(
                    'Found duplicate variable bindings: '
                    + dupeParts.join(', ')
                    + '.  Duplicated names lead to ambiguous bindings.'
                )
            }
        }
        
    }

    ,validate(tokens){
        const out =
            Object.values(PatternToken.singleValidations).map(
                f => f(tokens)
            );

        const invalids = out.filter( x => x.tag === 'N')
            .map( x => x.value );

        return invalids.length > 0
            ? Valid.N(invalids)
            : Valid.Y(tokens)
    }

    ,validateGroup(allTokensGroup){

        const validTokensGroup = 
            allTokensGroup.filter( ([,v]) => v.tag === 'Y' );
            
        const out =
            Object.values(PatternToken.groupValidations)
            .map(
                f => f( validTokensGroup.map( ([k,v]) => [k, v.value] ) )
            );

        const invalids = out.filter( x => x.tag === 'N')
            .map( x => x.value );

        return invalids.length > 0
            ? Valid.N(invalids)
            : Valid.Y(allTokensGroup)
    }


    ,toString: x => ({
        Path: x => x
        ,Part: x => ':'+x
    })[x.tag](x.value)

    ,toPattern: xs => xs.map( PatternToken.toString ).join('/')
};

const URLToken = {
    Path: value =>
        ({ case: 'Path'
        , tag: 'Path'
        , value
        , type: 'URLToken'
        })
    ,Part: ({ key, value }) =>
        ({ case: 'Part'
        , tag: 'Part'
        , value: { key, value }
        , type: 'URLToken' 
        })
    ,Variadic: ({ key, value }) =>
        ({ case: 'Variadic'
        , tag: 'Variadic'
        , value: { key, value }
        , type: 'URLToken' 
        })
    ,Unmatched: ({expected, actual}) =>
        ({ case: 'Unmatched'
        , tag: 'Unmatched'
        , value: { expected, actual }
        , type: 'URLToken' 
        })

    ,specificity: token => URLToken.fold({
        Path: 
            () => 0b100
        ,Part: 
            () => 0b010
        ,Variadic: 
            () => 0b001
        ,Unmatched:
            // We only sort matches
            /* istanbul ignore next */
            () => 0b000
    }) (token)
    
    ,tags: ['Path', 'Part', 'Variadic', 'Unmatched']
    ,specs:{}
    ,fold: ({
        Path,Part,Variadic,Unmatched
    }) => x => ({
        Path,Part,Variadic,Unmatched
    })[x.tag](x.value)

    ,toString: x => URLToken.fold({
        Path: x => x
        ,Part: ({ value: x, args='' }) => x+args
        ,Variadic: ({ value: x }) => x
        ,Unmatched: ({ actual: x }) => x
    }) (x)

    ,toURL: xs => 
        ('/' + xs.map( URLToken.toString ).join('/'))
            .split('/')
            .filter(Boolean)
            .join('/')

    ,toArgs: xs => xs.reduce(
        (p,n) => URLToken.fold({
            Part: ({ key, value }) => 
                Object.assign(p, { [key]: value })
            ,Path: () => p
            ,Unmatched: () => p
            ,Variadic: ({ key, value }) => 
                Object.assign(p, { [key]: value })
        }) (n),
        {}
    )

    ,fromPattern: o => segment => PatternToken.fold({
        Path: expected =>
            segment === expected 
                ? URLToken.Path(segment)
                : URLToken.Unmatched({ expected, actual: segment })
        ,Part: key =>
            URLToken.Part({ key, value: segment })
    }) (o)

    ,validations: {
        
        excessPatterns: patternTokens => urlTokens => {

            const numSegments = 
                urlTokens.length;

            const numPatterns =
                patternTokens.length;
                
            const excessPatterns = 
                numPatterns > numSegments
                ? patternTokens.slice(numSegments)
                : [];

            if( excessPatterns.length ){
                return Valid.N(
                    URLToken.Error.ExcessPattern({
                        urlTokens, patternTokens
                        ,excessPatterns
                    })
                )
            } else {
                return Valid.Y(urlTokens)
            }
        }

        ,unmatchedPaths: patternTokens => urlTokens => {
            const unmatched =
                urlTokens.filter( x => x.tag === 'Unmatched' );

            if( unmatched.length ){
                return Valid.N(
                    URLToken.Error.UnmatchedPaths({ patternTokens, urlTokens })
                )
            } else {
                return Valid.Y(urlTokens)
            }
        }
        
    }

    ,Error: {
        UnmatchedPaths({ patternTokens, urlTokens }){
            return {
                type: 'URLToken.Error'
                ,case: 'UnmatchedPaths'
                ,tag: 'UnmatchedPaths'
                ,value:
                    new TypeError(
                        'Pattern '+PatternToken.toPattern(patternTokens)
                            + ' could not match URL '
                            + URLToken.toURL(urlTokens)
                            + ' due to unmatched path segments: '
                            + urlTokens.map(
                
                                x => x.tag === 'Unmatched'
                                    ? URLToken.toString(x)
                                    : '...'
                            )
                            .join('/')
                    )
            }
        }

        ,ExcessPattern({ urlTokens, excessPatterns, patternTokens }){
            return {
                type: 'URLToken.Error'
                ,case: 'ExcessPattern'
                ,tag: 'ExcessPattern'
                ,value: new TypeError(
                    'The URL '+ URLToken.toURL(urlTokens) 
                    +' had excess patterns ('
                        + PatternToken.toPattern(excessPatterns)
                    + ')'
                    + ' when parsed as part of pattern:'
                        + ' ' +PatternToken.toPattern(patternTokens)
                )
            }
        }
    }

    ,validate(patternTokens, urlTokens){
        const out =
            Object.values(URLToken.validations).map(
                f => f(patternTokens) (urlTokens)
            );

        const invalids = out.filter( x => x.tag === 'N')
            .map( x => x.value );

        return invalids.length > 0
            ? Valid.N(invalids)
            : Valid.Y(urlTokens)
    }
};

function tokenizePattern(pattern) {

    const patternTokens =
        pattern.split('/').map(PatternToken.infer);

    return [patternTokens]
            .map(PatternToken.validate)
            .shift()
}

function tokenizeURL(patternTokens, theirURL){
    const url = theirURL;
        
    const urlTokens =
        url.split('/').slice(0, patternTokens.length).map(
            (segment, i) => 
                URLToken.fromPattern (patternTokens[i]) (segment)
        );

    const segments =
        url.split('/');
    
    const numSegments = 
        segments.length;

    const numPatterns =
        patternTokens.length;
        
    const excessSegments = 
        numSegments > numPatterns
        ? segments.slice(numPatterns)
        : [];

    const args = excessSegments;

    const completeTokens =
        urlTokens;

    return [URLToken.validate(patternTokens, completeTokens)]
        .map(
            Valid.map(
                () => urlTokens.concat( 
                    URLToken.Variadic({ 
                        key: 'args'
                        , value: args.join('/') 
                    }) 
                )
            )
        )
        .shift()
}

function routeValidator({ tokenized }){

    const groupInvalids = 
        [
            PatternToken.validateGroup(
                Object.entries(tokenized)
            )
        ]
        .flatMap(
            Valid.bifold(
                x => x, () => []
            )
        );

    // Pair (CaseName, PatternToken.Error[])
    const invalids =
        Object.entries(tokenized).filter(
            ([, tokens]) => tokens.tag === 'N'
        )
        .map( ([key, x]) => [key, x.value] )
        .concat(groupInvalids.reduce( (p,n) => p.concat(n), []));

    if( invalids.length ){
        return Valid.N(
            Object.entries(tokenized)
            .map(([k]) => [k, []])
            .concat( invalids )
            .reduce( (p,[k,v]) => {
                p[k] = p[k] || [];
                p[k] = p[k].concat(v); 
                return p
            }, {})
                
        )
    } else {
        return Valid.Y(tokenized)
    }
}


const formatArgs = args => 
    args
    ? args.startsWith('/')
        ? formatArgs(args.slice(1))
    : args.endsWith('/')
        ? formatArgs(args.slice(0,-1))
        : args
    : '';

function SafeRouteType({ typeName, tokenized }){
    let $;
    $= Object.entries(tokenized).map(
        ([caseName, tokens]) => {
            const keys = 
                tokens.value.reduce(
                    (p, n) => 
                        PatternToken.fold({
                            Path: () => p
                            ,Part: key => p.concat(key)
                        }) (n),
                    []
                )
                .sort();

            function of(theirO) {
                const { args='', ...o} = theirO || {};
                const foundKeys = Object.keys(o).sort();
                
                if( foundKeys.join('|') !== keys.join('|') ){
                    return Valid.N( 
                        new TypeError(
                            'Property mismatch for '
                                +typeName+'.'+caseName
                                + '.  Expected: {'+keys.join(',')+'}'
                                + ' but found: {'+foundKeys.join()+'}'
                        )
                    )
                } else {
                    return Valid.Y(
                        {
                            type: typeName
                            ,case: caseName
                            ,tag: caseName
                            ,value: { ...o, args: formatArgs(args) }
                        }
                    )
                }
            }

            return { 
                [caseName]: of
            }
        }
    );
    
    $= $.reduce( (p,n) => Object.assign(p,n), {});

    return $
}

function RouteType({ typeName, safeRouteType }){

    let $;
    $= Object.entries(safeRouteType).map(
        ([key, of]) => ({ 
            [key]: o => Valid.fold({
                Y: x => x
                ,N(err){
                    throw err
                }
            }) ( of(o) )
            
        })
    );
    
    $= $.reduce(  (p,n) => Object.assign(p,n) );
    $= {...$, type: typeName, specs: {}, tags: Object.keys(safeRouteType) };
    $= spec$3($);

    return $
}

const PatternMatches = 
    ({ tokenized, url }) => {

        const pairs = 
            Object.entries(tokenized).map(
                ([key, patternTokens]) => 
                    [key, tokenizeURL(patternTokens.value, url)]
            );

        const invalid = 
            pairs
            .filter( ([,valid]) => valid.tag === 'N' )
            .map(
                ([key, { value }]) => ({ [key]: value})
            )
            .reduce( (p,n) => Object.assign(p,n), {});

        const valid = 
            pairs
            .filter( ([,valid]) => valid.tag === 'Y' )
            .sort(
                ([,{ value: a}], [,{ value: b}]) => 
                    PatternToken.groupSpecificity(b) 
                    - PatternToken.groupSpecificity(a)
            );
            
        if( valid.length ) {
            return Valid.Y(valid)
        } else {
            return Valid.N(invalid)
        }
    };

const Matches = 
    ({ routeType }) => patternMatches => {

        return Valid.bifold(
            Valid.N,
            xs => 
                // xs being non empty is technically a precondition
                // to being marked as valid
                // but we check it in any case as the types make it possible
                xs.length == 0
                /* istanbul ignore next */
                ? Valid.N({})
                : Valid.Y(
                    xs.map(
                        ([caseName, { value }]) => 
                            routeType[caseName](
                                URLToken.toArgs(value)
                            )
                    )
                )
        ) (patternMatches)
    };

function type$safe(typeName, cases){
    // StrMap (CaseName, Valid( N::PatternToken.Error[] | Y::PatternToken[] ) )
    const tokenized = 
        Object.entries(cases).map(
            ([caseName, pattern]) => {
                return { [caseName]: 
                    tokenizePattern(
                        pattern.replace(/\/$/,'')
                    )
                }
            }
        )
        .reduce( (p,n) => Object.assign(p, n), {} );

    const validated = routeValidator({ tokenized });

    if( validated.tag === 'N' ){
        return validated
    } else {

        const safeRouteType =
            SafeRouteType({ typeName, tokenized });
        
        const routeType = 
            RouteType({ typeName, safeRouteType });

        const matches = url => {
            const patternMatches = PatternMatches({tokenized, url});    
            return Matches({ routeType }) (patternMatches)
        };

        const matchOr = (otherwise, url) => {
            const match = [url]
                .map(matches)
                .flatMap(
                    Valid.bifold(
                        otherwise,
                        x => x
                    )
                )
                .slice(0,1);

            return match.length > 0 
                ? match[0] 
                 /* istanbul ignore next */
                : otherwise({})
        };

        const toURL = routeCase => {

            const raw = 
                '/'
                + tokenized[routeCase.tag].value.map(
                    PatternToken.fold({
                        Part: key => routeCase.value[key]
                        ,Path: key => key
                    })
                )
                .concat( formatArgs(routeCase.value.args) )
                .join('/');

            return raw
                .replace(/\/$/, '')
                .replace('//', '/')
        };

        return Valid.Y(
            Object.assign(
                { safe: safeRouteType
                , matches
                , matchOr
                , toURL
                }
                , routeType
            )
        )
    }
}

const type = 
    (typename, cases) => 
        Valid.bifold(
            (errs) => {
                throw Object.values(errs)
                    .flatMap( xs =>  xs )
                    .map( x => x.value)
                    .shift()
            },
            x => x
        ) (type$safe(typename, cases));

var encaseNil = f => (...args) => {
    try { 
        const value = f(...args);
        if( value == null ) {
            throw new TypeError('Nil Result in encased function:' + f.toString())
        } else {
            return valueInstance('stags.Either', 'Y', value)
        }
    } catch (value) {
        return valueInstance('stags.Either', 'N', value)
    }
};

const dropRepeatsWith = eq => s => {
  const sentinel = {};
  let prev = sentinel;
  const out = stream$1();

  s.map(
    x => {
      if ( prev === sentinel || !eq(x, prev) ) {
        prev = x;
        out(x);
      }
      return null
    }
  );

  return out
};

const interval = ms => {
  const out = stream$1();

  const id = setInterval(
    () => out(Date.now())
    , ms
  );

  out.end.map(
    () => clearInterval(id)
  );

  out(Date.now());
  return out
};


const raf = () => {
  let last = Date.now();
  let running = true;
  const out = stream$1();

  function loop(){
    if (running){
      const dt = Date.now() - last;
      out({ dt });
      last = Date.now();

      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);

  out.end.map( () => running = false );

  return out
};

const afterSilence = ms => s => {
  let id;

  const out = stream$1();
  s.map(
    x => {
      clearTimeout(id);
      id = setTimeout(
        () => out(x), ms
      );
      return null
    }
  );

  return out
};

const throttle = ms => s => {

  const out = stream$1();
  let last = Date.now();
  let id = 0;

  function process(x){
    let dt = Date.now() - last;

    if( dt >= ms ){
      clearTimeout(id);
      out(x);
      last = Date.now();
    } else {
      id = setTimeout(process, Math.max(0, ms - dt), x );
    }
  }

  s.map(process);

  return out
};

const dropRepeats = s =>
  dropRepeatsWith( (a, b) => a === b)(s);

const watch = f => s =>
  dropRepeats(s.map(f));

const filter = f => s => {
  const out = stream$1();

  s.map(
    x => f(x) ? out(x) : null
  );

  return out
};

const map = f => s => s.map(f);
const decide = f => s => {
  const out = stream$1();
  s.map( f(out) );
  return out
};

const async = f => s => {
  const out = stream$1();
  s.map( x => f(x).then(out) );
  return out
};

const decideLatest = f => s => {
  let latest;
  const out = stream$1();

  s.map(
    x => {
      latest = {};
      const mine = latest;
      f(
        decision => {
          if(mine == latest) {
            out(decision);
          }
        }
      ) (x);

      return null
    }
  );

  return out
};

const funnel = xs => {
  const out = stream$1();

  xs.map( s => s.map(
    // mithril doesn't seem to queue burst writes
    // so this does that for them
    // can't seem to repro this out of the app
    x => setTimeout(out, 0, x)
  ));

  return out
};

const sink = s => {
  const out = stream$1();

  out.map(s);

  return out
};

const source = s => {
  const out = stream$1();

  s.map(out);

  return out
};

const scan = seed => f => s => stream$1.scan(f, seed, s);

const of = stream$1;

const merge = xs => stream$1.merge(xs);

const log = o => Object.entries(o).forEach(
  ([k,v]) => v.map( x => console.log(k, x ))
);

const session = () => {

  const session = [];
  const of = (...args) => {
    const out = stream$1(...args);
    session.push(out);
    return out
  };

  const end = () => {
    session.map( s => s.end(true) );
  };

  return { of, end }
};

var stream = /*#__PURE__*/Object.freeze({
  __proto__: null,
  dropRepeatsWith: dropRepeatsWith,
  interval: interval,
  raf: raf,
  afterSilence: afterSilence,
  throttle: throttle,
  dropRepeats: dropRepeats,
  watch: watch,
  filter: filter,
  map: map,
  decide: decide,
  async: async,
  decideLatest: decideLatest,
  funnel: funnel,
  sink: sink,
  source: source,
  scan: scan,
  of: of,
  merge: merge,
  log: log,
  session: session,
  'default': stream$1
});

/* globals Proxy, Symbol */

const $delete = undefined;

const select = $ => o => {
	const results = [];
	$( x => {
		results.push(x);
		return x
	}) (o);
	return results
};

const $propOr = otherwise => key => transform => parent => {

	const re_integer =
		/^\d+$/;

	const newParent =
		parent == null
		? re_integer.test(key)
			? []
			: {}
		: Array.isArray( parent )
			? parent.slice()
			: { ...parent };

	const existingValue =
		newParent[key] == null
			? otherwise
			: newParent[key];

	const response = transform(existingValue);

	if( response === $delete) {
		delete newParent[key];
		return newParent
	} else {
		newParent[key] = response;
		return newParent
	}

};

const $filter = predicate => f => o => {
	return predicate(o) ? f(o) : o
};

const $map = visitor => $ => x =>
	$(visitor(x));

const $flatMap = visitor => f => o => {
	const $ = visitor(o);

	return $(f) (o)
};

const $union = (...$s) => f => o =>
	$s.reduce( (o,$) => $(f) (o), o );

const compose = fns => o =>
	fns.reduceRight( (o, f) => f(o), o);

const $zero = () => o => o;

const $values = f => xs =>
	Array.isArray(xs)
		? xs.flatMap( x => {
			const response = f(x);
			if( response === $delete) {
				return []
			} else {
				return [response]
			}
		})
		: Object.keys(xs)
			.reduce(
				(p,n) => {
					const response = f(xs[n]);
					if( response === $delete) {
						return p
					} else {
						return { ...p, [n]: response }
					}
				}
				, {}
			);

const $prop = $propOr(undefined);

function Query({
	path=[]
}){

	let $;

	function prop(...args){
		$ = $ || compose(path);

		const isGet =
			args.length == 0;

		const isOver =
			!isGet
			&& typeof args[0] === 'function';

		return (
			isGet
				? select($)
			: isOver
				? $(args[0])
				: $(() => args[0])
		)
	}

	prop.path = path;
	prop.delete = $delete;
	prop.drop = $delete;
	prop.filter = f => {
		return Query({
			path: path.concat( $filter(f) )
		})
	};

	Object.defineProperty(prop, 'values', {
		get(){
			return Query({
				path: path.concat($values)
			})
		}
	});

	Object.defineProperty(prop, 'zero', {
		get(){
			return Query({
				path: path.concat($zero)
			})
		}
	});

	prop.union = (...$s) => {
		return Query({
			path: path.concat( $union(...$s) )
		})
	};

	prop.insertQuery = query => {
		return Query({
			path: path.concat( query )
		})
	};

	prop.flatMap = visitor => {
		return Query({
			path: path.concat( $flatMap(visitor) )
		})
	};

	prop.map = visitor => {
		return Query({
			path: path.concat( $map(visitor) )
		})
	};

	function toString(){
		// improve later
		return prop.toString()
	}

	const out = new Proxy(prop, {
		get(_, theirKey){
			const key =
				typeof theirKey == 'string'
				&& /^\$\d+$/.test(theirKey)
				? theirKey.slice(1)
				: theirKey;

			if ( key == Symbol.toPrimitive ) {
				return toString
			} else if( typeof key == 'string' ){
				if( key == '$') {
					return prop.insertQuery
				} else if( key.startsWith('$') ) {
					return prop[key.slice(1)]
 				} else {
					return out.$( $prop(key) )
				}
			} else {
				return prop[key]
			}
		}
	});

	out.toString = Function.prototype.toString.bind(prop);

	return out
}

const $ =
	Query({
		path: []
		, select
	});

/* globals Proxy, Symbol */

const Z = ({
  stream: theirStream2
  , query: $$1=$

  // optional custom stream
  , read= () => theirStream2()
  , write= f => theirStream2( f(theirStream2()) )
  , notify= f => watch( $$1() ) (theirStream2).map(f)
}) => {

  const ourStream = of();
  const removed = of();

  ourStream.deleted = removed;

  let lastGet;

  let ignoreNotification = false;

  const over = f => {
    ignoreNotification = true;
    write( $$1(f) );

    return lastGet = ourStream( $$1() (read())[0] )
  };

  const throttled = ms =>
    afterSilence(ms) (dropRepeats(ourStream));

  const get = () =>
    [ read() ]
    .map( $$1() )
    .map(
      results => {
        if( results.length ) {
          // async redraw can mean a view is using Z.get()
          // to retrieve a list item that doesn't exist anymore
          // so we cache the last get
          lastGet = results[0];
          return lastGet
        } else {
          return lastGet
        }
      }
    )
    .shift();

  notify( () => {
    if( !ignoreNotification ) {
      ourStream( get() );
    }
    ignoreNotification = false;
  });

  const remove = () => {
    const existing = get();

    write( $$1($$1.$delete) );

    removed( existing );
  };

  function prop(...args){
    if( args.length ) {
        if( typeof args[0] == 'function' ) {
            return over(...args)
        } else {
            return over( () => args[0] )
        }
    }
    return get()
  }

  function query(visitor){
    const query = visitor($$1);

    const z = Z({
      stream: theirStream2
      , read
      , write
      , query
    });

    return z
  }

  let others = {
    delete: remove
    , deleted: removed
    , stream: ourStream
    , query
    , throttled
    , filter: f => query( x => x.$filter(f) )
    , flatMap: f => query( x => x.$flatMap(f) )
    , get values(){
      return query( x => x.$values )
    }

    // add methods to the Z instance
    // todo-james make router use this instead of
    // the custom proxy
    , instance(f){
      others = f(others);
      return out
    }
  };

  const out = new Proxy(prop, {
    get(_, theirKey){
      const key =
        typeof theirKey == 'string'
        && /^\$\d+$/.test(theirKey)
        ? theirKey.slice(1)
        : theirKey;

      if ( key == Symbol.toPrimitive ) {
        return toString
      } else if( typeof key == 'string' ){
        if( key == '$') {
          return query
        } else if( key.startsWith('$') ) {
          return others[key.slice(1)]
        } else {
          return query( x => x[key] )
        }
      } else {
        return others[key]
      }
    }
  });

  return out
};

var A = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $: $,
  encaseNil: encaseNil,
  stream: stream,
  query: $,
  Z: Z,
  type: externalTags,
  fold: fold,
  Y: Y,
  N: N,
  bifold: Ebifold,
  getOr: EgetOr,
  getWith: EgetWith,
  bimap: Ebimap,
  map: Emap,
  mapY: EmapY,
  mapN: EmapN,
  assertY: EassertY,
  assertN: EassertN,
  chainN: EchainN,
  chainY: EchainY,
  tagBy: EtagBy,
  chain: Echain,
  toBoolean: EtoBoolean,
  encase: Eencase,
  fromNullable: EfromNullable,
  all: Eall,
  any: Eany,
  isY: EisY,
  isN: EisN,
  ys: Eys,
  ns: Ens,
  concatWith: EconcatWith,
  either: externalEither,
  maybe: externalMaybe,
  Either: decoratedEither,
  valueInstance: valueInstance,
  emptyInstance: emptyInstance,
  toString: toString$1,
  toJSON: toJSON,
  otherwise: otherwise,
  tagName: tagName,
  typeName: typeName,
  getTags: getTags,
  pipe: pipe,
  run: run,
  tags: externalTags,
  decorate: spec$3,
  mapAll: mapAll,
  chainAll: chainAll,
  errMessage: errMessage,
  StaticSumTypeError: StaticSumTypeError,
  boundToString: boundToString
});

const map$1 = f => pair => [pair[0], f(pair[1])];
const fromEntries$1 = Object.fromEntries;
const toEntries = Object.entries;
const mapEntries = f => xs => xs.map(map$1(f));

const mapOverObj = f => o => 
    fromEntries$1( mapEntries(f) ( toEntries(o) ) );

/* globals Proxy, Symbol */

const normalizeArgs = s =>
  s
  .split('/')
  .filter(Boolean)
  .join('/');

const normalizePath = s =>
  '/' + normalizeArgs(s);

function routeV2({
  z: route
  , Route
  , rootRoute=null
}){

  const href = (newRoute) =>
    Route.toURL(newRoute);

  function link(theirNewRoute, options={}){
    const newRoute =  theirNewRoute;
    return {
      href: href(newRoute)
      ,onclick(e) {
        const nextRoute = {...newRoute, ...options};

        route( nextRoute );
        e.preventDefault();
      }
    }
  }

  const defaultOptions = { replace: false };
  function subroute(type$1, defaultRoute, theirDefinition, options={}){

    options = { ...defaultOptions };

    const parentRoute = out;
    const parentRouteValue = out();

    const prefix =
      parentRoute.href( $.value.args('') ( parentRouteValue ) );

    const definition =
      run(
        theirDefinition
        ,mapOverObj(
          key => normalizePath(prefix+'/'+key)
        )
      );

    const SubRoute = type(type$1, definition);
    let current;
    let initialRouteTag = route().tag;

    const routeStream = route.$stream;
    const z = Z({
      stream: routeStream,
      read(){
        if( initialRouteTag != route().tag ){
          routeStream.end(true);
          return current
        }
        let $;

        const pathname = rootRoute.toURL( rootRoute() );

        $= SubRoute.matchOr(
          () => defaultRoute(SubRoute), pathname
        );

        if(
          SubRoute.toURL($) != rootRoute.toURL(rootRoute())
        ){
          if( current ) {
            z($);
          }
        }
        current=$;

        return $
      },
      write(f){
        if( initialRouteTag != route().tag ){
          routeStream.end(true);
          return current
        }
        const next = f(current);

        const { replace=options.replace } = next;

        // global URL thanks to pattern extensions
        const url = SubRoute.toURL(next);

        const nextRoot = rootRoute.matchOr( () => rootRoute(), url);

        rootRoute( { ...nextRoot, replace });

        current = next;
        return next
      }
    });

    return routeV2({ z, Route: SubRoute, rootRoute })
  }

  const others = {
    ...Route
    , type: Route
    , link
    , subroute
    , href
    , map: route.$stream.map
  };

  const out = new Proxy(route, {
    get(_, theirKey){
      const key =
        typeof theirKey == 'string'
        && /^\$\d+$/.test(theirKey)
          ? theirKey.slice(1)
          : theirKey;

      if ( key == Symbol.toPrimitive ) {
        return toString
      } else if( typeof key == 'string' ){
        if( key in others ) {
          return others[key]
        } else {
          return route[key]
        }
      }
    }
  });


  if(!rootRoute){
    rootRoute = out;
  }

  return out
}

const ActiveModule = ({ getState, moduleCache }) => {
  const route$ = watch( x => x.route ) (getState);

  const out = merge([
    route$, moduleCache
  ])
  .map(
    ([ route, moduleCache ]) => {

      const module =
        EfromNullable(moduleCache[route.tag]);

      const component =
        run(
          module,
          Echain(
            module =>
              module.Main
                ? Y(module.Main)
              : module.default
                ? Y(module.default)
              : module.view || typeof module == 'function'
                ? Y(module)
                : N()
          )
        );

      return { module, component }
    }
  );

  return out
};

const Downloaded = externalEither('Downloaded');

const ResolveService = download => getState => tell => {
  const route$ = watch( x => x.route ) (getState);

  route$.map(
    route => Promise.resolve(download(route))
      .then( Downloaded.Y, Downloaded.N )
      .then( downloaded =>
        tell( downloaded )(route)
      )
  );
};

const ModuleCacheService = download => (getState, moduleCache) => {

  const assoc = ({ route, module }) => moduleCache(
    { ...moduleCache(), [route.tag]: module },
  );

  // Actually download the code
  ResolveService(download)(getState)(
    Downloaded.fold({
      Y: module => route => {
        assoc({
          route, module
        });
      }
      , N: e => route =>
        // eslint-disable-next-line no-console, no-undef
        console.error('Error downloading code', e, route)
    })
  );
};

/* globals addEventListener, history, window */

function meiosis({ toURL, fromURL, getPath, stream, throttle: throttle$1=500 }) {

  const $route = $.route;

  const throttler = throttle$1 == 0
    ? () => s => s
    : throttle(throttle$1);

  const startURL = url => {
    const popstates = stream();

    popstates.map(
      () => setTimeout(
        () => m.redraw(), 100
      )
    );

    throttler ( dropRepeats(url) ).map(url => {
      if (url+'' !== getPath()) {
        const search =
          url.route.search
          || window.location.search;

        if( url.route.replace ) {
          history.replaceState({}, "", url+search);
        } else {
          history.pushState({}, "", url+search );
        }
      }
      return null
    });

    addEventListener("popstate", () => popstates(getPath()));

    return popstates
  };

  const start = model$ => {
    const url$ = model$.map(model =>
      [model]
        .flatMap( $route() )
        .map(route => {
          const url = toURL(route);

          return {
            valueOf(){
              return url
            }
            ,route
          }
        })
        .shift()
    );

    return startURL(url$).map(url =>
      [url]
        .map(fromURL)
        .map( x => $.route(x) )
        .shift()
    )
  };

  return {
    start
  }
}

const ensureFn = x => typeof x == 'function' ? x : () => x;

function RouteMount(vnode) {
    return {
    view: ({ children, attrs: { attrs: getAttrs } }) => {
      const childAttrs = { ...getAttrs() };
      return children.map( f => f(childAttrs) )
    }
  }
}

const defaultRouteError = pathname =>
  'No route was found for url: '
    + pathname
    + '!  Please provide a defaultRoute.';

const componentWithAttrs = globalAttrs => f => () => {
  return {
    view: ({ attrs }) =>
      m(Inline, { ...globalAttrs(),...attrs, view: f })
  }
};

function Inline({ attrs }){
  const session$1 = session();
  attrs.stream = session$1.of;

  Object.keys(stream).forEach(
    k => attrs.stream[k] = stream[k]
  );

  const {
    route
    , state
    , moduleCache
    , activeComponent
    , activeModule
    , v
    , stream: stream$1
    , view: attrsView
    , ...customAttrs
  } = attrs;

  const streamAttrs = Object.entries(customAttrs).reduce(
    (p,[k,v]) => ({ ...p, [k]: dropRepeats(session$1.of(v)) })
    , {}
  );

  streamAttrs.dom = attrs.stream();

  const view = attrsView({
    route
    , state
    , moduleCache
    , activeComponent
    , activeModule
    , v
    , stream: stream$1
    , ...streamAttrs
  });

  return {
    onremove: () => session$1.end()
    ,oncreate({ dom: theirDom }){
      streamAttrs.dom(theirDom);
    }
    ,onupdate({ attrs }){
      Object.entries(attrs).forEach(
        ([k,v]) => k in streamAttrs
          ? streamAttrs[k](v)
          : null
      );
    }
    ,view(attrs){
      return view(attrs)
    }
  }
}

const mount = (
  container,
  {
    Route: theirRoute,
    initial: theirInitial,
    services: theirServices,
    default: theirDefault,
    reducer: theirReducer,
    location: theirLocation,
    streamKey: theirStreamKey,
    render: theirRender
  }
) => {

    // eslint-disable-next-line no-param-reassign
    theirRoute = theirRoute || {
      Home: ['/', null]
    };

    const render =
      theirRender
      || (
        ({ activeComponent, ...attrs }) =>  {
          return activeComponent()
            ? v(activeComponent(), { key: attrs.route().tag, ...attrs})
            : null
        }
      );

    const Route =
      type(
        'Route'
        , Object.fromEntries(
          Object.entries(theirRoute)
            .map( ([k,[urlPattern]]) => [k,urlPattern])
        )
      );

    const initial = (...args) => {
      const state = theirInitial ? theirInitial(...args) : {};

      if( !state.route ){
        state.route = fromURL(getPath());
      }

      return state
    };

    const location = theirLocation
      // eslint-disable-next-line no-undef
      || typeof window !== 'undefined' ? window.location : null;

    const getPath = () => decodeURI(location.pathname);

    const streamKey = theirStreamKey || (({ route }) => route.tag);

    const download =
      Route.fold(
        Object.fromEntries(
          Object.entries(theirRoute)
            .map( ([k,[,download]]) =>
              [k, ensureFn(download)])
        )
      );

    const failedMatchSentinel = {};

    const defaultRoute =
      theirDefault
      ? theirDefault(Route)
      : Route.matchOr( () => failedMatchSentinel , '/');

    if( defaultRoute == failedMatchSentinel ){
      throw new Error(defaultRouteError('/'))
    }

    const toURL = Route.toURL;
    const fromURL = route => Route.matchOr(() => defaultRoute, route);

    const reducer = theirReducer || ((x, f) => f(x));

    const Router = meiosis({
      toURL
      , fromURL
      , getPath
      , stream: of
    });

    const setState = of();
    const active = of();
    const moduleCache = of({});

    const activeModule = watch( x => x.module ) (active);

    const activeComponent = watch( x => x.component) (active);

    const getState =
      scan
        (initial({ location }))
        (reducer)
        (setState);

    const state =
      Z({ stream: getState, read: getState, write: setState });

    const routeStream =
      watch(x => x.route) (getState);

    const nullableActiveModule =
      activeModule.map( EgetOr(null) );

    const nullableActiveComponent =
      activeComponent.map( EgetOr(null) );

    function hyperscript(...args){
      if (typeof args[0] == 'function'){
        return m(
          Inline,
          { view: args[0], ...attrs(), ...(args[1] ? args[1] : {}) }
        )
      } else {
        const out = m(...args);

        if ( out.attrs && out.attrs.hook ) {
          const hooks = [].concat( out.attrs.hook );
          delete out.attrs.hook;
          const oncreate = out.attrs.oncreate;
          const onbeforeremove = out.attrs.onbeforeremove;
          const ends = [];

          out.attrs.onbeforeremove = (vnode) => {
            return ends.reduce( (p, f) => p.then(f), Promise.resolve() )
              .then(
                () => onbeforeremove && onbeforeremove(vnode)
              )
          };

          out.attrs.oncreate = (vnode) => {

            const session$1 = session();
            vnode.attrs.stream = session$1.of;

            Object.keys(stream).forEach(
              k => vnode.attrs.stream[k] = stream[k]
            );
            const hookAttrs = { ...vnode, ...attrs(), ...vnode.attrs };

            hooks.map(
              f => {
                return Promise.resolve(f(hookAttrs))
                  .then( result => {
                    if( result ) {
                      if ( 'end' in result ) {
                        ends.push( () => result.end(true) );
                      } else if ( typeof result == 'function' ) {
                        ends.push( result );
                      }
                    }
                  })
              }
            );

            if( oncreate ){
              oncreate(vnode);
            }
          };
          delete out.hook;
        }
        return out
      }
    }
    const v = hyperscript;
    v.css = bss;
    v.css.helper('desktop', x =>
      v.css.$media('(min-width: 600px)', x)
    );
    v.request = m.request;
    v.redraw = m.redraw;
    v.component = componentWithAttrs( () => attrs() );

    Object.assign(v, A);

    const attrs = () => {

      const route = routeStream;

      const activeModule = nullableActiveModule;
      const activeComponent = nullableActiveComponent;

      return {
        state

        ,route // stream
        ,moduleCache // stream
        ,activeModule // stream
        ,activeComponent // stream
        ,v
        ,state
        ,route: routeV2({ z: state.route, Route: Route })
      }
    };

  function Main() {
    return {
      oncreate() {
        Router
          .start( getState )
          .map( setState );

        if( theirServices ) {
          theirServices(attrs());
        }

        ModuleCacheService
          (download) (getState, moduleCache);

        ActiveModule({ getState, moduleCache })
          .map(active);

        const jsonEquals = (a,b) => JSON.stringify(a) === JSON.stringify(b);

        dropRepeatsWith(jsonEquals) (activeModule).map( () => {
          main.debug && console.log('activeModule redraw');
          m.redraw();
        });

        dropRepeatsWith(jsonEquals) (moduleCache).map( () => {
          main.debug && console.log('moduleCache redraw');
          m.redraw();
        });

        dropRepeatsWith(jsonEquals) (activeComponent).map( () => {
          main.debug && console.log('activeComponent redraw');
          m.redraw();
        });
      }
      , view: () =>
          m(RouteMount,
            { key: streamKey(getState()), attrs },
            render
          )
    }
  }
  m.mount(container, function App() {
    return {
      view: () => m(Main, attrs)
    }
  });

  return {
    state, Route, route: routeStream, v
  }
};

const main = mount;

main.css = bss;
main.request = m.request;
main.redraw = m.redraw;
main.$ = $;
main.Z = Z;
main.A = A;
main.css = bss;

export default main;
