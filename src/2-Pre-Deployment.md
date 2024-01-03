# A Priori Verification {#chap:specific}

To allow thought about the verification of systems after deployment, we will 
first establish a top-down agile work flow for *a priori* verification in this 
chapter. To this end, we will introduce the different abstraction levels from 
informal, naturally phrased specifications down to implementational aspects and 
show how these can be connected in such a way that requirements can be tracked 
and verified across different abstraction levels. In the subsequent chapters, 
this will allow us to choose where self-verification plugs into the flow.

## Background

Traditional hardware design languages (HDLs) such as Verilog or VHDL which are
supposed to be synthesised into hardware are increasingly unable to handle large
scale designs due to their inherent limitations. For example, they require
designers to specify systems to the point where they can be synthesised
automatically. The resulting designs need to be built from the bottom up and can
only be verified by thorough testing once complete [@Perry2002;@Thomas2002]. This approach cannot cope
with the shorter design cycles and reduced time to market required in today's
marketplace. 
{.changed}

The remedy suggested in this chapter is to provide designers with more abstract 
languages that allow systems to be designed top-down, starting with an abstract 
model of the system and its requirements.

Several of these languages are being used today. Natural language specifications 
are the most abstract form of describing a system, allowing the designers to use 
arbitrary language to explain how the system is supposed to behave and be 
structured.	Formal modelling languages such as the UML or SysML build on a 
formal definition to avoid the issue of ambiguities in the description. 
System-level modelling language such as SystemC are the last step before 
synthesisable HDLs, allowing to build virtual prototypes that can be simulated 
without actually implementing in the final hardware design.

These languages form a hierarchy and are supposed to be used subsequently: 
providing a natural language description first, then formalising it, providing a 
system level model and finally implementing the design at the register transfer 
level gradually leads designers through the process.

However, when following this approach, several new challenges arise: firstly, we 
have to keep the models in the different levels of abstraction *consistent* 
across the different languages and formalisms involved, secondly, we need a 
uniform notion of *refinement*, and thirdly, we want to be able to 
*track changes* and their impacts across the different levels of abstraction.

In this chapter we will present a framework which aims at meeting these
challenges. The framework provides a uniform management of specifications
in these languages at a syntactic level, semantics to relate their
meaning (as far as possible) by a notion of refinement, and a comprehensive
change management across all levels. We have implemented the framework in a
prototype of the *Change Impact Analysis and Control Tool* ([ChImpAnC]{style=font-variant:small-caps}) to 
demonstrate its principal applicability.
It is particularly the change management which makes this approach viable,
because we need to be able to handle changing specifications effectively;
changes are the norm, rather than the exception, as the design will rarely
be correct the first time, and moreover the tool supported afforded at the
more abstract levels will help us to find errors earlier in the design
process, necessitating these changes.

## Hardware Design Abstractions {#sec:layers}

This section gives an overview over different abstraction levels in
system design, starting with the most abstract description and successively
approaching traditional HDLs.

### The Informal Specification Level (ISL)

The most abstract way to describe a system is natural language.

When designing a system, specifying its properties without having to worry
about details of mathematical notation and simply using the language one is
familiar with instead is a straightforward way to start the design process.

Natural language does not restrict the designer in any way. This openness
means that this description cannot be formalised: while natural languages
come with grammars that restrict the available constructs, these rules do
not mean that the result is an unambiguous description of the system.
While natural language processing (NLP) techniques can address some issues,
an automatic formalisation of arbitrary text is neither possible nor
desired, meaning that these specifications need to be processed manually.

### The Formal Specification Level (FSL)

The next step to describe a system in a more exact way are formal
languages.
Standardised languages such as the Systems Modelling Language (SysML) give
designers a way to describe the system readily but at the same time force
them to adhere to a formal grammar that makes these descriptions
unambiguous [@drechsler2014fsl].  SysML thus offers a way to add
precision to the system description.

Still, this formalised notation does not specify all aspects of the system;
e.g. the SysML lacks the ability to express non-functional requirements such
as timing properties.
In other words, FSL models formalise the constraints inherent in the
design; e.g. structural diagrams enriched with OCL limit what actions may be
performed by the system and how the output values may then be structured.
However, while these models may be used to locate potential errors early on
in the design process, they are neither complete nor actually executable.

### The Electronic System Level (ESL) {#sec:esl}

The next step in refining the system is to create a working prototype
without going into the implementation details required by HDLs.  System
level modelling languages such as SystemC can describe the behaviour of
systems without specifying how this functionality is supposed to be
implemented.

SystemC, as the current de-facto ESL standard language [@schulz2004],
allows systems to be described using the C++ programming language while at
the same time offering designers the means to describe the structural
features of a hardware design.  The result is a virtual prototype that can
be simulated: parts that are meant to represent hardware are managed by a
dedicated simulation kernel which invokes the relevant software parts.
This means that the ESL design is much less abstract than at the FSL,
representing a model of the system that can be executed, while still being
too abstract to be translated into hardware.

However, there are several modern alternatives to SystemC with less commercial 
traction (for now) such as *Chisel* [@Chisel], a DSL embedded in Scala, and 
*Clash* [@Clash], a language based on Haskell. These share the advantage of 
having explicit semantic models, which allow for sophisticated static analysis 
as well as synthesis of lower level RTL models (see below).

In the following we will only consider SystemC (due to its commercial traction 
and importance in the community) and Clash (for its extensibility and clear 
semantics).

### The Register Transfer Level (RTL) and below

From the ESL, we can map the system design further down to the Register 
Transfer Level, which gives designers the ability to design systems that 
may be translated into hardware [@hafer1983formal].

Dedicated HDLs are specifically designed to be mapped to hardware, focusing on 
the description of structural features and parallel execution while at the same 
time limiting the designer concerning elements that cannot be built as hardware 
parts such as loops (which need to be unrolled and hence bounded).

Where ESL models can just specify that a module calculates a result using 
arbitrary means (such as a call to a given software library), RTL designs need 
to specify how exactly the results are computed.

### Different Levels of Abstraction

These different abstraction levels all have particular purposes and use
cases:

- Natural language offers a way to quickly come up with an initial
  description of a given system that is well-readable without prior
  training and not restricted concerning the described properties;
- FSL models specify system properties in a precise way amenable to
  formal analysis and reasoning;
- ESL models offer virtual prototypes to be run and tested;
- RTL implementations allow the design to be translated into hardware.

All the different levels describe the same system, yet they are written in
different and at first sight unconnected languages.  Thus, we need to
ensure that the models at the different abstraction levels are consistent:
the natural language requirements need to be represented as formal
properties at the FSL, the classes modelled at the FSL need to appear at
the ESL in corresponding form etc. Further, one abstraction level
may contain several models of the system at different degrees of
abstraction: at first, an FSL model should be no more than a translation of
the natural language requirements, while a more detailed FSL model should
be detailed enough such that we can translate it into SystemC at the
ESL. This is called *refinement*: gradually adding more details which
constrain the model of the system. Keeping the models throughout the
development consistent with each other is called *functional change management*.

### Example: an Access Control System {#sec:acs-example}

As an example, consider the design of an access control system
(appropriated from [@Abrial]). It should control the access of people
to buildings by controlling the doors. Initial natural language
requirements state facts about their relations ([#fig:case-study-isl]).

````{caption="Example - Informal Specification Level" #fig:case-study-isl}
P1: The model is composed of people and buildings
P5: Any person in a given building is authorised to be there
````

To formalise requirements such as these, we introduce SysML blocks, with
added OCL constraints. Here, classes initially include people and
buildings; associations include $\textit{aut}$ and $\textit{sit}$, which
point to the buildings someone is authorised to enter, or is currently
in, respectively ([#fig:case-study]). 

![Example - Formal Specification Level (block definition diagram)](acs-diagram-blocks.svg){#fig:case-study width=67%}

There is one OCL constraint which states that every person can
only be in a room she or he is authorised for, i.e.
$\textit{sit}\in\textit{aut}$. ([#fig:case-study-ocl]). 

````{.ocl #fig:case-study-ocl caption="Example - Formal Specification Level (ocl constraint)"}
context Person
  inv P5: self.aut->includes(self.sit)
````

These formalised but very loose
constraints can now be refined further. For example, we introduce
doors which connect buildings, and people are authorised to access certain
doors.  To make this into an ESL specification, we then describe the actual
mechanics of operating the door in more detail: when a person is
approaching the door, a green or red light should indicate whether access is
granted or denied, and a turnstile should open (or not). This can be
expressed by a state machine diagram in SysML ([#fig:case-study-state]).

![Example - Formal Specification Level (state machine diagram)](acs-diagram-state.svg){#fig:case-study-state width=80%}

In our refinement steps, we have replaced modelling classes such as people
and buildings by implementation classes like doors. The final refinement step
translates a state machine diagram into a SystemC implementation, with doors (but
not people) becoming components (called `SC_MODULE` in SystemC), comprised of a 
card reader, a turnstile, and green and red LEDs. The turnstile has a method 
`operate` which implements the state machine diagram above ([#fig:case-study-systemc]).

```{.cpp caption="Example - Electronic System Level" #fig:case-study-systemc}
SC_MODULE(Door)
{
  //...
  LED grn;
  LED red;
  Turnstile ts;
  Gate gc;
}

SC_MODULE(Gate)
{
 //...
 void operate()
 {
   //...
 }
};
```

## Working with SysML

When working with OCL-constrained SysML models, there is a large collection of 
tools available, which let us design diagrams. These can be classified into two 
groups. On the one hand those which have an underlying semantic model and on the 
other hand graphical tools without a semantic model (of SysML). Examples for the
former are *Astah SysML*, *Papyrus*, *System Architect* or *Enterprise Architect*. 
Since we want to formally verify compliance to the specification, we are dependent 
on the semantic model and thus will not consider the tools from the latter class 
(e.g. *Microsoft Visio* or *Capella*).

We have chosen to support Papyrus, which is based on the Eclipse Modelling 
Foundation. However, since SysML is thoroughly specified 
[@SysML], it should be fairly straight forward to map between different 
representations.

The reason we chose Papyrus is the fact, that it is the only Framework which 
allows for semantically meaningful OCL constraints. All other tools we have 
investigated treat constraints as verbatim text with a language annotation that 
can indicate an OCL constraint or any other language (another specification 
language, natural language or a programming language), without the possibility
to semantically connect the OCL constraint to the surrounding model.

We have developed our own textual representation of SysML (called *SPECifIC SysML*) 
which is based on the graphical appearance of diagrams. In this section we give 
an overview over the language.

### Scope of the Language

SPECifIC SysML covers a formally well-defined subset of SysML, in particular it
does not support parametric diagrams since they are redundant and can be 
expressed with OCL constraints. In addition we dropped activity, sequence and 
use case diagrams, since they only represent test cases and cannot be used to 
fully specify the behaviour of a system. State machine diagrams are the only 
behavioural diagrams we support. All other behavioural aspects have to be 
modelled by means of the OCL. However, since SPECifIC SysML compiles to Papyrus
Models it can still be combined with any diagram type that is not supported in 
the textual representation.

### Syntax

The language tries to mimic the appearance of drawn diagrams while keeping it 
"writable". We use indentation to indicate the structure of a diagram and 
transfer every textual rule that SysML specifies into the grammar of the 
language. Most other aspects such as comments, literals and delimiters are taken 
from the OCL Language specification. Constraints are always assumed to be 
written in OCL and by this don't require language annotations. In 
[#fig:sysml-spec] the example from [#sec:acs-example] is expressed in SPECifIC 
SysML.

````{.sysml #fig:sysml-spec .standalone caption="The example from [#sec:acs-example] expressed in SPECifIC SysML"}
bdd [package] fsl6::acs [ACS]
---------------------------------------------------------------

block Building
  references
    gate: Building[*] <- building
      derive: org_dom.dest->asSet()
    building: Building[*] <- gate
    org_dom: Door[*] <- org

block Person
  operations
    admitted(q: Door): Boolean { query }
      post P17: q.org = self.sit and self.aut->includes(q.dest)
  references
    aut: Building[*]
    sit: Building[1] { subsets aut }    

block Door
  values
    green: Boolean
      derive: dap->notEmpty()
    red: Boolean
  operations
    accept()
      pre: not (green or red)
    refuse()
      pre: not (green or red)
      post: red
    pass_thru()
      pre: green
    off_grn()
      pre: green
    off_red()
      post: not red
  references
    org:  Building[1] <- org_dom
    dest: Building[1]    
  owned behaviors
    state machine EnterBehavior
      initial state Waiting
        accept / -> Accepting
        refuse / -> Refusing
      state Accepting
        off_grn / -> Waiting
        pass_thru / -> Waiting
      state Refusing
        off_red / -> Waiting
````

### Semantics

The semantics of the language are completely externalised to the unterlying 
Papyrus framework. Every Diagram expressed in SPECifIC SysML is mapped to a 
Papyrus SysML Diagram.

### Refrence Compiler{#sec:sysml-impl}

Further details about the syntax and semantics of the lanugage can be found 
online in the reference implementation which is freely available. Here, also 
further tooling around the language can be found.

[![https://github.com/DFKI-CPS/specific-sysml - GitHub](https://gh-card.dev/repos/DFKI-CPS/specific-sysml.svg?fullname=)](https://github.com/DFKI-CPS/specific-sysml){.ghlink}

## A Framework for Change Impact Analysis {#sec:functionalChangeManagement}

Functional change management calculates the impact of syntactical changes using 
the semantics of the documents. In order to implement it across the different 
levels of abstraction, we need a unifying semantics for the different levels.

### Related Work

Change impact analysis offers more than the currently used source code 
management (SCM) tools (Git, Subversion, Mercurial, etc.); our work does not 
compete with any of these but augments them with functional change management, 
and the proposed solution could be easily integrated into any of these existing 
SCM solutions.

There are several isolated approaches to functional change management for some 
of the individual specification levels we described. EMF itself for example 
offers a toolset to analyse differences between two models [@EMFDiff], there 
exists a change management systems for UML diagrams [@briand2003impact], and 
there is a wealth of techniques on traceability and requirements management 
[@Jarke98,DOORS]. However, these systems share several limitations, the foremost 
being that there are no semantic connections to external models which could be 
taken into consideration, leaving the user without knowledge about impacts to 
other specification layers. Furthermore, we are not aware of any other change 
management tool available which is able to calculate the impact of changes on 
the correctness of SysML/OCL refinements. In addition, [ChImpAnC]{style=font-variant:small-caps} supports impact 
analysis between different abstraction levels.

The analysis of SystemC designs is a complex task that is a research field on 
its own.  Embedding SystemC into a change managed workflow is
thus a non-trivial task as a various C++ dialects need to be supported,
each tied to compilers that generate an optimised binary version of the
design to be run that is stripped of all non-essential meta information.
Different approaches to extract the given information include parsing the
source code [@Fey2004;@Karlsruhe2012;@Castillo2007;@Brandolese2006;@Berner2005] 
(which results in the support of only a subset of SystemC, as no existing 
parser supports all given dialects) or using modified compilation workflows in 
order to modify the executable design to trace and store the required data 
itself [@Genz2009;@Moy2005;@Grosse2003] (which results in the support of all 
designs that are built using the compiler being used).  In order to keep our 
approach as applicable as possible, the approach given in [@stoppe2013data] was 
used: instead of relying on the source code, the compiler-generated debug 
symbols are used. While the format itself differs between compiler 
architectures, it is always standardised and/or accessible, resulting in a 
reliable interface to retrieve structural descriptions from SystemC designs.

The OCL approach to specification with preconditions, postconditions and
invariants is called design by contract and goes back to
[@Meyer1992]. More recently, this approach can be found in
component-based design (rich components [@Benvenuti2008]), or
so-called light-weight specification languages based on a programming
language, such as JML [@Chalin2006] for Java or ACSL [@ACSL] for
C. The latter two focus on what corresponds to the lowest abstraction layer
in our setting, the ESL.  Existing tools for the whole workflow
across all abstraction layers are rare; most closely related are
so-called wide-spectrum languages [@bauer1978towards] which cover the
whole of the design flow. For example, our running example was originally
conceived for the B language [@Abrial2005].  Atelier B, the tool
supporting B, covers the whole design flow, similar to Event-B, an
extension of B with events, which is supported by the Rodin tool
chain [@Abrial2010Rodin].  Another prominent example is
SCADE [@DionGartner05], which supports seamless and rigorous
development from abstract specification down to executable software or
RTL code by code generation techniques.

The drawback of all these languages and tools is that they
tie the user into one language and methodology for the whole design flow, whereas our
approach offers designers a best-of-breed approach, and integrates into
existing design flows.  Moreover, we are not
aware of any attempts to apply impact analysis on any of these
wide-spectrum languages.

### Underlying Semantics

[We based our reasoning about the semantics on the reduction to Kripke 
structures. At it's core a Kripke structure consists of a set of states, a
transition relation between states, and an associated set of atomic propositions
for each state, which hold within that state. By adopting Kripke structures, we 
are able to encapsulate crucial concepts like state transitions and 
state-dependent behaviors, offering a foundational basis for verifying 
properties and understanding the behavior of our system.]{.changed}

Each considered specification level carries its own semantics, shedding light on
specific aspects of the system:
{.added}

Informal Specification Level{.added}

: The ISL cannot have a mathematically precise semantics, as such would
  counteract our motivation to use natural language in the first place (we want
  users to be able to express initial specifications without having to worry
  about mathematical rigour at the same time). Instead, we use NLP techniques
  to decompose the natural language requirements into single semantically
  meaningful requirements, which form the semantic entities at the ISL.
  Additionally, if NLP does not offer satisfying results, connections between
  elements of the FSL and the ISL can be drawn manually in order to properly
  detect the impact of changes across the different abstraction levels.

Formal Specification Level{.added}

: Our interpretation of the Formal Specification Level (FSL) is based on a 
  semantically well-defined subset of SysML, which includes class, object 
  and state diagrams as well as OCL constraints.
  {.changed}

  In this context, class and object diagrams provide a notion of state (see 
  [@RichtersGogolla2002] for details). Classes describe the system state 
  through an object model, while object diagrams represent specific instances 
  of these states (in particular, the initial states). The transitions between 
  these states are governed by OCL constraints, which specify the conditions 
  under which state transitions may occur.
  {.changed}

  A formal definition of our FSL subset as introduced in [@Drechsler2016], is 
  given by the tuple:
  {.changed}

  $$SP=\langle\cal{M},init,{\rm O{\small PN}},inv,pre,post,st\rangle$${.changed}

  - $\mathcal{M}$ denotes the set of classes within the specification, essentially forming the object model for OCL expressions.
  - $init$ specifies the initial states of the system.
  - ${\rm O{\small PN}}$ represents the set of class operations available in the specification.
  - $inv$ includes class invariants that must always hold true.
  - $pre$ and $post$ are functions that define the pre- and postconditions for the operations in ${\rm O{\small PN}}$.
  - $st$ comprises the set of state diagrams, which are simplified in our formal subset to exclude hierarchical states and concurrent regions. This allows representing state diagrams as pre- and post-conditions over virtual class attributes that track the state.
  {.changed}

  This FSL specification can be further condensed into a Kripke structure, denoted as $[\![ SP ]\!] = \langle S, I, \rightarrow \rangle$, where:
  {.changed}

  - $S$ is the set of all possible states of the system.
    {.added}
  - $I$ is the set of initial states that satisfy both the conditions in $init$ and the invariants in $inv$.
    {.added}
  - The transition relation $\rightarrow$ encapsulates all permissible state transitions for any operation $o \in {\rm O{\small PN}}$ from one state $\sigma_1 \in S$ to another $\sigma_2 \in S$, under the following conditions:
    {.added}
    1. All invariants hold in both $\sigma_1$ and $\sigma_2$.
    2. The preconditions of $o$ are satisfied in $\sigma_1$.
    3. The postconditions of $o$ are satisfied in $\sigma_2$.      


Electronic System Level{.added}

: At the ESL, the semantics are given by the SystemC semantics. States are
  given by the instances of the SystemC modelling classes (`SC_MODULE` etc.),
  and transitions are given by the simulation (see [@SystemCStandard] for
  details; however, we use a reasonable abstraction from the concrete SystemC
  implementation instead of a mathematically precise model of the
  implementation). Thus, the semantic entities at the ESL are classes,
  attributes, and methods. For this, we have implemented a semantic meta model
  for SystemC based on EMF:

  [![https://github.com/DFKI-CPS/scemf - GitHub](https://gh-card.dev/repos/DFKI-CPS/scemf.svg?fullname=) ](https://github.com/DFKI-CPS/scemf){.ghlink}

### Semantic Relations Across Specification Levels{.added}

The semantic entities on the respective abstraction levels give rise to
notions of mapping between them. From the ISL to FSL and ESL, we map each
requirement to one or more specification elements which implement
them. Within the FSL, we can utilize a more formal notion of refinement based on 
the underlying Kripke structures as introduced in [@Drechsler2016]:

We distinguish two forms of refinement: 

Let $\cal A$ and $\cal C$ be Kripke structures representing abstract and 
concrete specifications within the FSL, respectively. 



a concrete specification $\cal C$ is a
refinement of an abstract specification $\cal A$ if each state transition
in $\cal C$ can be mapped back to a state transition in $\cal A$, i.e.
$\cal C$ restricts the possible state transitions of $\cal A$. This
refinement can be realised by refining the state (data refinement) or the
operations (operational refinement).
An example of data refinement is the introduction of new classes or
attributes; an example of operational refinement is the implementation of a single
operation by a state diagram. 

From the FSL to the ESL, we have the usual implementation of SysML diagrams,
except that we may map classes in the FSL to instances of the `sc_module` class
(corresponding to the fact that in hardware, objects exist more or less *a
priori*). Within the ESL (i.e. between two SystemC models) we do not consider
refinement, as this would require a more sophisticated semantic modelling of
SystemC to consider e.g. timing requirements.

A system development consists of several *layers* $L_1,\ldots,L_n$,
which group specifications from one
abstraction level. The first layer typically contains
the natural language specifications, and the last layer $L_n$ ESL or RTL
specifications. Between layers, specifications are related via
refinement: a specification $SP$ from layer $L_i$ is mapped to a
specification $SP'$ of layer $L_{i+1}$ if $SP'$ is a semantic
refinement. This mapping allows us to keep track of properties; for
example, if all initial ISL requirements are mapped to formal properties
which are later proven we can be confident that the implementation
satisfies the original specifications.

The mappings are mostly constructed automatically (see
[#sec:mappings] below), but some have to be constructed by the
user (in particular, the mapping of ISL requirements).

### Syntactic Representation

The specifications on the different levels are written in different formalisms, 
each in their own syntax. Since we aim to support a wide variety of 
file types in an extensible way, it would be inflexible to implement a parser 
for every concrete input syntax. Hence we decided to employ the widely adopted, 
generic Eclipse Modelling Framework (EMF) [@steinberg2008emf], which serves as a common 
basis for other file types. This means that any format is supported as soon as 
there is a translation into EMF.

At the ISL, specifications are represented as a list of SysML requirements. At 
the FSL, we use the SysML tools provided by the Papyrus Framework 
[@lanusse2009papyrus], as well as the EMF OCL representation. For the ESL, we 
make use of the fact that SystemC models are valid C++ source files, and employ 
the debug output of the clang compiler to generate an EMF model.
The files contain DWARF debug information that can be extracted using the 
libdwarf/dwarfdump tools. The resulting data is translated to the EMF format 
using a custom parser/translator. The final result includes namespace and class 
structures with type hierarchies, operations and attributes.


### Syntactic Difference Analysis

The architecture of the functional change management has been derived
from previous work in the generic GMoC system [@GMoC]. A generic diff
algorithm for hierarchical annotated data serves as a basis [@Diff],
and provides support for syntactic difference analysis. We adapted this
algorithm to operate on generic EMF objects (EObjects). This way we can
obtain a minimal set of changes between two EMF files. The GMoC diff
algorithm allows us to specify equivalence between the objects; in our
case, which attributes identify an object, which orderings have a meaning
and which do not. The example in [#fig:simeq] states that a SysML
block is identified by its name, and that the order of the contained
attributes and operations is irrelevant, while on the other hand the
order of the parameters of an operation has a semantic meaning.

````{.equivspec #fig:simeq caption="Example *ecore.equivspec* file"}
element Block {
  annotations {
    name!
  }
  constituents {
    unordered { _ }
  }
}

element Operation {
  annotations {
    name!
  }
  constituents {
    ordered { _ }
  }
}
````

### Semantic Difference Analysis

The distinctive feature of the diff algorithm is that it takes the
intended semantics of the documents into account. This is achieved by
representing the semantics as a graph (*explicit semantics*).
The semantic graph is extracted from the syntactic graph
by graph rewrite rules, which can be efficiently implemented in Neo4j;
after extraction, the nodes of this semantic graph are connected to the
origin nodes of the syntactic tree ([#fig:explicitSemantics0]).

![Change management via explicit semantics after initial extraction](mappings-1.svg){#fig:explicitSemantics0 width=80%}

When a change in an input file occurs, a diff is applied to the syntactic
tree. Then, we mark the nodes of the semantic graph as "deleted"
([#fig:explicitSemantics1]) and extract the graph again
([#fig:explicitSemantics2]). Nodes that are already present in
the graph are marked as "preserved", nodes that do not exist are marked as
"added", and all other nodes remain marked as "deleted". During this process
additional semantic knowledge can be used to handle individual nodes as
required. 

![Change management via explicit semantics after application of syntactic diff](mappings-2.svg){#fig:explicitSemantics1 width=80%}

![Change management via explicit semantics after second extraction](mappings-3.svg){#fig:explicitSemantics2 width=80%}

Thus, we have the *syntactic graph* which consists of the abstract
syntax trees, and the *semantic graph* extracted from them.  We
store both graphs uniformly in the Neo4j graph database, because it
allows us to efficiently traverse and transform them while providing
superb scalability. On top of this we implemented an interface from EMF
to Neo4j which allows us to analyse differences between files on disk and
the persisted syntactic tree in the database:

[![https://github.com/DFKI-CPS/egraph - GitHub](https://gh-card.dev/repos/DFKI-CPS/egraph.svg?fullname=)](https://github.com/DFKI-CPS/egraph){.ghlink}

[![https://github.com/DFKI-CPS/secore - GitHub](https://gh-card.dev/repos/DFKI-CPS/secore.svg?fullname=)](https://github.com/DFKI-CPS/secore){.ghlink}

### Change Impact Analysis {#sec:mappings}

The semantic graphs of specifications from adjacent layers can be mapped
semi-automatically by inspecting naming, types and structure of
models. Users are always in control of these mappings and can alter
or complement them where required to reflect their intentions.

Change propagation follows syntactic changes across the origins along the
mappings of the semantic graph. That is, if a syntactic change occurs we
find which parts of the semantic graph have their origins in that part
of the syntactic graph which has changed, and then check which mappings
either point into, or originate from, this part of the semantic graph.
To illustrate, consider our example ([#sec:acs-example]): ISL
requirement P5 (left) gets mapped to OCL invariant P5 (middle-left); if
either the requirement or the OCL invariant is changed, the other is
impacted by the change, as inconsistencies between the two might
arise. If the user changes the state diagram in the ESL, this change
might impact the ESL implementation, or on the other hand the OCL
invariants of the class diagram.

For data or operation refinements, we can calculate the impact of changes more 
accurately. If we add additional operations to the class `Building` in 
[#sec:acs-example], all data refinements of `Building`  will remain valid.
The situation gets more complex when we consider the proof obligations that 
arise from refined OCL constraints. These proof obligations are of the form 
$c_1 \wedge ... \wedge c_n \Longrightarrow d$, where $c_1$ to $c_n$ are 
constraints on the refined level and $d$ is a constraint in the abstract level.
If this is proven, we can discharge the obligation and insert additional 
dependency edges between the constraints $c_1,\ldots,c_n$ and $d$. If one of
these constraints changes the proof will be invalidated and the proof obligation 
pops up again.

Impact rules such as these are described directly as Neo4j queries; this makes 
them fast to execute and keeps the impact system extensible.

## Reasoning about OCL {#sec:ocl}

To discharge proof obligations that arise from the formal specification level, 
we need a method to transfer constraints into lower level representations. For 
OCL there exists a thorough specification of the semantics [@OCLSpec], however 
SystemC (and especially its extensions, e.g. TLM) has no such specification, and
even the host language C++ is not unambiguous across compilers and platforms. 

So Clash (See [#sec:esl]) is a natural choice if we not only want to map and 
trace changes across layers but also conduct verification (and trace 
verification results) across layers. For this we have developed a dedicated 
backend that can translate Clash designs into SMT Bitvector logic (See also 
[#sec:clash-smt]). In addition we have built a small tool that can generate the 
proof obligations as SMT assertions from the SysML Model, the OCL Constraints 
and the Mappings to the ESL design.

## A User Interface for Change Impact Analysis {#sec:frontend .changed}

In this section, we explore a user interface tailored for change management
analysis: [ChImpAnC]{style=font-variant:small-caps}. Developed as part of our
approach to a priori verification, this interface serves as a practical tool to
illustrate how changes in the system can be analyzed more effectively, offering
insights into potential applications and future enhancements.
{.added}

[ChImpAnC]{style=font-variant:small-caps} is realised as a web interface and can
either run locally or on a team server. When users open the application in a
browser they get presented a multi-column layout representing the different
specification layers ([#fig:screen-main]). The leftmost column is the most
abstract one --- typically natural language --- while every additional column to
the right represents a refinement step. There are usually more refinement steps
involved than would fit into the user interface, so there is a navigation bar on
the top where one can select the layer in focus. 

![The ChImpAnC user interface](screen-main.png){#fig:screen-main}

Natural language descriptions are treated specially due to the fact that they 
might be mapped to arbitrary lower specification layers. I.e. it might be 
intended that an abstract formal description does not contain every 
requirement described by a stake holder and that the requirements are taken 
care of in subsequent refinements. They may be locked by clicking on the lock 
icon on the lower right, such that the user is able to relate the natural 
language description to lower level refinements.

All extracted model elements are represented as bold identifiers. Mapped
model elements appear green. When a user hovers the mouse over such a mapped
element, the corresponding refinement is visually emphasised
([#fig:mapping]).

![Highlighting of mappings](screen-mappings.png){#fig:mapping}

Inconsistencies are highlighted with red wavy underlines. These include
elements (abstract models, attributes, references, operations or parameters)
which are unmapped in a refinement ([#fig:inconsistency]), as well
as mismatching mapped types and inconsistent multiplicities of references.
In addition, unproven OCL refinements are displayed as a red number next to
the respective class definition which indicates the number of open proof
obligations. Conversely, discharged proof obligations appear as a green
number ([#fig:proofobligation]). When the user moves the mouse over
a marked element, a tooltip will appear containing information about the
inconsistency.

![Highlighting of inconsistencies](screen-missingimpl.png){#fig:inconsistency}

![Inline display of proof obligations](screen-proofobl.png){#fig:proofobligation}

Content warnings are highlighted with orange wavy underlines. These are
currently only present in natural language where we automatically rate the
quality of refinements, using the techniques from [@nlp]. Again, a
detailed description of the warning can be obtained by hovering the mouse
over the marked element ([#fig:warning]).

![A content warning in natural language](screen-nlwarn.png){#fig:warning}

Finally, change management support is implemented by impacts. An impact
can either indicate that a refinement has changed or that the abstraction
has been changed or removed; impacts warnings are the default fallback
when there is no automatic solution to propagate a change across
layers. It still offers a high value to developers because the possibly
affected portions of refinements and abstractions can be narrowed down
to small fractions of the specification and inconsistencies can easily be
identified. Removed refinements do not trigger an impact warning because
they already result in an inconsistent model, and thus an inconsistency
error. Impact warnings appear as orange elements indicating that user
attention is required ([#fig:impactWarn]).

![An impact warning](screen-modifiedimpl.png){#fig:impactWarn}

## Conclusion

This chapter introduced the different layers of abstraction that may be used to
design systems top-down. We presented SPECifIC SysML a textual modelling 
language that supports a formal subset of the SyML. We integrated all this in 
[ChImpAnC]{style=font-variant:small-caps}, a tool which supports a comprehensive 
system design flow across different levels of abstraction, from natural language 
down to system-level models. [ChImpAnC]{style=font-variant:small-caps} manages 
the models of the systems at the different abstraction levels, keeps track of 
dependencies, and calculates the impact of changes.  Moreover, it can warn about 
inter layer inconsistencies that would previously be left unnoticed by the 
established tool chain. The tool is freely available online:

[![DFKI-CPS/chimpanc - GitHub](https://gh-card.dev/repos/DFKI-CPS/chimpanc.svg?fullname=)](https://github.com/DFKI-CPS/chimpanc){.ghlink}

We will use this foundation to develop the idea of self-verification in the
subsequent chapters.