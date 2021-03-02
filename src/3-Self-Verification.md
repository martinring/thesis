# Principles of [Self-Verification]{.nobr}

*This chapter is based on the original work "Better Late Than Never: Verification of Embedded Systems After Deployment" [@Selfie2]*

## General Idea {#sec:selfie-general-idea}

The key idea of the proposed approach presented here is to defer part of the
verification until *after* deployment. At first sight, this seems like a rather strange
idea. A system deployed in the field is likely to have far less
computational power, memory and network resources available than a
design server. However, it has a main advantage which, we argue,
outweigh theses deficiencies: after deployment, there is generally
*more information* about the operating context available.

In order to enjoy this benefit, the design needs to be geared
towards verification after deployment. At an abstract level, the general
idea is to partition the system state space into one part which changes
frequently post-deployment and thus has to be explored symbolically, and one
part (preferably as large as possible) which only changes
infrequently. This part is called the *configuration*.
Marking a variable as a configuration variable means that
its value rarely changes, and entails that we can substitute actual
values before verification post-deployment. By marking variables of $n$ bits as
configuration variables, we reduce the search space we need to explore for
verification by $2^n$ -- turning the exponential growth into an exponential
reduction.

The idea and its benefits are illustrated by the following (running)
example, which has been deliberately kept simple in order to keep the focus on the methodology.

![Bringing light into darkness: The light controller is connected
to a luminosity sensor, and switches a light on or off when it becomes
too dark or bright.](light-sensor-sketch.svg){#fig:sketch .small}

:::Example *
The simple light controller system sketched in [#fig:sketch]
works as the running example in the following. This system
connects a controller to a luminosity sensor and a light switch. The
controller should turn on the light if the sensor $e$ drops below a given
level $e_{lo}$, and turn it off if it exceeds a given level $e_{hi}$. To
avoid a flickering effect when the luminosity varies close to a given
threshold, the lower and upper threshold levels are not equal
(hysteresis), and the system should switch off the light only with a
certain delay $d$.

The threshold levels $e_{lo}, e_{hi}$ and the delay $d$ are
configuration variables, and can be changed post-deployment.
:::

Systems like these are designed in a flexible fashion, so that they
can be applied in various contexts. For the light controller, the threshold levels and delay are not fixed at
design or production time but will be set post-deployment.  Hence, in order to verify the correctness of the system, we need to take into account
*all* possible configurations, which increases the search space
exponentially. It also means that a lot of possible configurations are
checked during verification which may never be applied during the system's
lifetime. Hence, if we instantiate the configuration variables after
deployment and keep only the variables of the system which change frequently arbitrary, we get a much smaller search space to explore.

:::Example * continued blub 
Consider again the running example. If we assume a width of
8 bit for the input values (the luminosity sensor and
subsequently for the upper and lower bounds) and the time delay,
and one bit for the light switch status
(these are lower bounds for a realistic system), we get the following
search space (where $cnt$ is a variable counting up to delay):

$$
\begin{array}{}
\underbrace{\begin{array}{}
e_{lo} & e_{hi} & d\\
8 & 8 & 8
\end{array}{}}_{configuration} &
\begin{array}{}
e & cnt & status & & total\\
8 & 8 & 1 & = & 41
\end{array}
\end{array}
$$

<!-- TODO EQ -->
  
Thus, we need to check an overall search space of $2^{41}$ states to verify the
system, a huge search space for a very simple example.

In contrast, once the system is deployed and applied in the field, the
values for $e_{lo} $, $e_{hi}$ and $d$ rarely change (once when
the system is deployed, and afterwards only if the user actively changes
the configuration), as opposed to the values of $e$, $cnt$ and
$status$ which vary constantly. Thus, we can mark $e_{lo}$, $e_{hi}$
and $d$ as configuration variables, and verify the system only
when the configuration is changed. By keeping the values of $e_{lo}$,
$e_{hi}$ and $d$ fixed for the verification, the search
space reduces to $2^{17}$ states.
:::

The reduced search space can be handled comfortably by a lightweight solver
after deployment, even under the prevailing conditions of limited
computational resources.  But note that this verification is only valid for
the particular configuration (i.e. the supplied values for 
$e_{lo}, e_{hi}$ and $d$) and, thus, can principally not be done prior to deployment
without severely reducing the flexibility and versatility of the system.

## Implementation

The previous section illustrated the potential of conducting verification
after deployment.  Based on that, we now describe in detail a possible
implementation of this methodology. We first describe the
design process in more detail, and then demonstrate it at work with a
formal development of the running example considered in the previous section.

### The Design Process

The design flow starts with a *modelling phase*, where the structure
and behaviour of the system is modelled at an abstract level without
referring to any implementation details (see [#fig:design-flow]). In
our case, we use SysML [@SysML] and OCL [@RichtersGogolla:2002] to
specify the structure and formalize constraints on its behaviour as well as the
functional hardware description language Clash [@ClaSH] for a uniform,
executable and synthesizeable model of the system.

The actual specification and implementation languages are of no
particular relevance and could be replaced by others (e.g. we could use
UML instead of SysML, or SystemC instead of Clash), but serve here to
point out the level of abstraction in the corresponding part of the
design process.

From the model, we can synthesize an *implementation* of the system
by generating a representation in a low-level hardware modelling language such as VHDL or
Verilog, which is used to program an FPGA -- constituting the actual
implementation. Moreover, we want to *verify* that the generated
system behaves as specified. In order to do so, we generate a list of
*verification conditions* from the executable system model and the
specification which have to be shown in order to guarantee this.

Specifically, we translate both the Clash model and the constraints from
the OCL specification into *bit-vector logic* (i.e. first-order logic
with bit-vectors). Trying to show these in an SMT prover such as
Yices [@Dutertre:2014] or Z3 [@Z3] fails for non-trivial examples, as does trying to show the properties
translated into *conjunctive normal form* (CNF) with a SAT solver such as
MiniSat. This is where verification usually fails.

However, post-deployment after we have instantiated the configuration
variables, the search space is small enough to allow verification of the
corresponding properties even by a lightweight solver [@Bornebusch2017TowardsLS].
By this, verification of all properties becomes possible. Recall that this
instantiation cannot be done at the design time, because at that point the
instantiating values are still unknown. Therefore, the proofs must be rerun
if the values of the configuration variables are changed.

### The Design Process At Work

![Design flow for verification after deployment. We start with modelling
the system behaviour, then derive an implementation and 
verification conditions. By proving the verification conditions we make sure
the system behaves as specified. Due to the large search space, the
proofs are not possible pre-deployment. But instantiation
of the configuration variables reduces the size of the search space
significantly and makes proofs possible post-deployment.](design-flow.svg){#fig:design-flow}

In the following, we apply the design flow to the simple example from [#sec:selfie-general-idea].

#### Specification (top of [#fig:design-flow])

The specification of the system is provided in terms of a SysML block definition
diagram as shown in [#fig:design-spec].  The structure is composed of the
controller as the central block, with one luminosity sensor, and one light
switch (actuator) connected. The variables specifying the
lower and upper threshold of luminosity and the delay when switching off
are in a separate block marking them as configuration variables.

![SysML specification of the light controller](sysml-spec.svg){#fig:design-spec}

````{.ocl #fig:ocl-spec caption="OCL specification of the behaviour of the light controller"}
context Controller
  def e: sensor.value
  def off: e > config.e_hi
  def on: e < config.e_lo
  def off_s: cnt>=config.delay

context Controller::tick()
  post a1: not off implies cnt=0
  post a2: off implies cnt=cnt@pre+ 1
  post a3: on implies light.status
  post a4: off_s implies not light.status
  post a5: not (on or off_s) implies
            light.status=light.status@pre
````
The behaviour is provided in OCL as shown in [#fig:ocl-spec]. We model state 
transitions by an explicit operation `tick()`; The pre- and postcondition of the
state transition are denoted as pre- and postconditions of this operation.

#### Model (middle of [#fig:design-flow])

Based on the specification, a Clash model is derived.

Clash is a strongly typed domain-specific language to model hardware. It
is embedded into the functional programming language Haskell, and describes
the hardware as functions of the language. The strong type system guarantees
that everything we can describe in Clash is still synthesizeable, and
allows us to model the hardware at an abstract but still executable level.

The model describes the hardware by combinators (higher-order functions),
building up complicated circuits by composing elementary
ones. [#fig:clash] shows the model, essentially a
finite-state machine (a Mealy automaton) with the luminosity values
(*Unsigned 8*) and the configuration as input, the light switch
(*Bool*) as output, and an internal state (*ControllerState*)
which keeps track of the light switch and a counter to implement the delay
when switching off. The function *controllerT* (definition omitted
for brevity) is the state transition function of the automation, taking the
state and the input, and returning a tuple of new state and output.

````haskell {#fig:clash caption="Clash model of the light controller (excerpt)"}
type ControllerState = (Bool,Unsigned 8)

controllerT :: ControllerState
  -> (Configuration, Unsigned 8)
  -> (ControllerState, Bool)

controller :: Signal (Configuration, Unsigned 8)
  -> Signal Bool
controller = mealy controllerT (False,0)
````


#### Implementation (left-hand side of [#fig:design-flow])

From the Clash model, we generate Verilog, which is
then compiled onto the FPGA by the proprietary tool chain of the FPGA vendor
(in our case, Xilinx). Thus, the Clash model is the foundation of the
verification after deployment.

#### Verification (right-hand side of [#fig:design-flow])

To prove the verification conditions, we translate them into
CNF, which is suitable as input for reasoning engines such as SAT solvers. 
This translation proceeds in two steps. We first translate both the Clash model 
and the specification into bit-vector logic, which in the second step can be 
translated into CNF by Yices. The translation from Clash is done with an 
extension of the Clash compiler we have developed for this work; the 
translation of OCL is done by the tool-chain described in [#chap:specific].

[#fig:bv-spec] shows a small excerpt of the bit-vector representation
of the model from [#fig:clash]. We are modelling the state transition
explicitly, so for each state variable (e.g. *switch*, *cnt*) we have a
variable to model the pre-state (here, *preSwitch*, *preCnt*).
[#fig:bv-spec] asserts that the state switches to *true*
if the luminosity value drops below *e_lo* and it switches to
*false* if the luminosity is above the threshold and
*cnt* is larger or equal to the configured *delay*.

````smt-lib {#fig:bv-spec caption="Implementation modelled in bit-vector logic (excerpt)"}
(define preSwitch :: bool) ; light switch before
(define switch :: bool)    ; light switch after
(assert
  (= switch
     (ite (bv-lt e e_lo)
       true
       (ite (and (bv-gt e e_hi) (bv-ge preCnt delay))
         false
         preSwitch
) )  ) )
````

To verify the implementation, we translate the specification from OCL
 into bit-vector logic; for example, the two
clauses *a4* and *a5* from [#fig:ocl-spec] become:

````smt-lib
(=> off_s (not switch))))
(=> (not (or on off_s)) (= switch preSwitch))))
````

We generate a CNF formula from the negated conjunction of all five clauses
(and the invariants) in [#fig:ocl-spec], together with the model from
[#fig:bv-spec]. This formula is satisfiable iff the specification is
violated (because we assert the negated specification).

Because we explore the complete search space (there is no state abstraction
involved), this procedure is not only sound but also complete; if we cannot
find a counter-example, the verification condition holds.

#### Instantiation after Deployment (bottom of [#fig:design-flow])

````cnf {#fig:cnf-simple caption="CNF in DIMACS format for a very simple assertion. Lines starting with $c$ are comments; the line starting with $p$ states the number of variables and clauses; the following lines are the clauses, each line containing one conjunct consisting of a disjunction of variable $i$ or its negation $-i$ (terminated by $0$). A suitable representation of this format is used post-deployment."}
c   e_hi --> [5 6]
c   e --> [3 4]
p cnf 7 6
-3 7 0
4 -6 0
4 7 0
5 7 0
-6 7 0
3 -5 -7 0
````

Finally, the configuration variables are instantiated in order to reduce
the search space.  This is directly conducted in the obtained CNF. In
order to give an impression of the generated CNF, we just consider the very
simple assertion $e \leq e_\text{hi}$, which translates into
bit-vector logic as the assertion:

````smt-lib
(assert (not (bv-lt e e_hi))).
````

Using only two bits for $e$ and $e_\text{hi}$, Yices generates the CNF as shown in
[#fig:cnf-simple], which represents
these bit-vectors as variables, corresponding to the formula.Here, $x$ is an auxiliary
variable. $e_1$ and $e_2$ denotes the first respectively the second bit of the bit-vector $e$. The same notation applies to $e_\text{hi}$.:

$$
\begin{equation}
  \label{eq:cnf-very-very-very-simple}
  \begin{array}{l}
   (\neg e_1 \vee x) \wedge (e_2 \vee \neg e_{hi,2}) \wedge
   (e_2 \vee x) \wedge \\
   (e_{hi,1} \vee x) \wedge (\neg e_{hi,_2} \vee x) \wedge
   (e_1 \vee \neg e_{hi,1} \vee \neg x).
  \end{array}
\end{equation}
$$

Yices keeps track of the encoding of the variables, i.e. to instantiate the
configuration variables, we add corresponding unit clauses, e.g. to
instantiate $e_\text{hi}$ with the value $2$ ($10$ in binary) we add
two unit clauses stating

$$ 
e_{hi,1} \wedge \neg e_{hi,2}. 
$$

The instantiations now significantly reduce the search space. This can be
exploited to solve the resulting instance after deployment using a
lightweight solver. As we can see, the actual reduction of the
search space depends on the values we instantiate the variables
with. 

## Evaluation {#sec:eval}

Table: Evaluation Results

| System           | Search space | Variables | Clauses | Time     |
|:-----------------|:------------:|----------:|--------:|---------:|
| **simple**       | $2^{41}$     | 161       | 539     | $< 0.1s$ |
| **average**      | $2^{177}$    | 11807     | 40086   | $131.0s$ |
| **weighted_avg** | $2^{545}$    | 43569     | 146642  | $> 24h$  |
| **smart**        | $2^{9504}$   | 1421153   | 4761633 | $> 24h$  |
| **multiplier**   | $2^{32}$     | 1177      | 6096    | $> 24h$  |
