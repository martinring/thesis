# Fundamentals of [Self-Verification]{.nobr} {#chap:selfie}

In this chapter, we propose a simple design and verification methodology which 
conducts verification after deployment. To this end, we start with the 
observation that contemporary systems are designed to operate in a variety of 
operating contexts. In order to do so, *configurations* are used, i.e. parameters
which are set post-deployment by the particular environment of the individual 
system. While these parameters may not change frequently, they are not fixed and 
hence verification, which, thus far, is conducted prior to deployment, has to 
consider all possible configurations.

We indicate these configurations as *quasi-static*. Consequently, designers and 
verification engineers are faced with verifying systems with huge possible 
search spaces, while after deployment just a fraction is used.

Engineers might restrict the set of allowed configurations at design time
in order to reduce the search space and make verification succeed, but this
increases costly design time, and runs the risk of excluding possible
configurations, decreasing availability, making the system less versatile
and hence less marketable than strictly necessary.

Motivated by this observation, this chapter proposes a design and verification
methodology which conducts verification after deployment, i.e. in the field and 
once the actual configuration is observable. 
Even though it results in continuous verification tasks as the environment 
keeps changing, the drastic reduction of the search space outweigh this. As a 
result, embedded and cyber-physical systems can be verified even on a much 
weaker machine and with much less sophisticated tools, while prior to deployment 
verification failed due to the exponential complexity.

In order to assess the feasibility of the proposed methodology, we have
implemented the proposed design and verification flow and used a lightweight 
version of the SAT solver MiniSat [@ES:2003,@light-weight-SAT-solving] to solve
the resulting verification conditions after deployment. The evaluation of a 
number of case studies showed that, following the proposed methodology, 
verification problems which failed prior to deployment (using high-end 
verification tools and machines) could be completed after deployment using the 
lightweight solver on reduced hardware.

## General Idea {#sec:selfie-general-idea}

The key idea of the proposed approach presented here is to defer part of the
verification until *after* deployment. At first sight, this seems like a rather strange
idea. A system deployed in the field is likely to have far less
computational power, memory and network resources available than a
design server. However, it has a main advantage which, we argue,
outweigh these deficiencies: after deployment, there is generally
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

![Bringing light into darkness: The light controller is connected
to a luminosity sensor and switches a light on or off when it becomes
too dark or bright.](light-sensor-sketch.svg){#fig:sketch .small}

Systems like these are designed in a flexible fashion, so that they
can be applied in various contexts. For the light controller, the threshold levels and delay are not fixed at
design or production time but will be set post-deployment.  Hence, in order to verify the correctness of the system, we need to take into account
*all* possible configurations, which increases the search space
exponentially. It also means that a lot of possible configurations are
checked during verification which may never be applied during the system's
lifetime. Hence, if we instantiate the configuration variables after
deployment and keep only the variables of the system which change frequently 
arbitrary, we get a much smaller search space to explore.

The reduced search space can be handled comfortably by a lightweight solver
after deployment, even under the prevailing conditions of limited
computational resources.  But note that this verification is only valid for
the particular configuration (i.e. the supplied values for 
$e_{lo}, e_{hi}$ and $d$) and, thus, can principally not be done prior to deployment
without severely reducing the flexibility and versatility of the system.

:::Example * continued 
Consider again the running example. If we assume a width of
8 bit for the input values (the luminosity sensor and
subsequently for the upper and lower bounds) and the time delay,
and one bit for the light switch status
(these are lower bounds for a realistic system), we get the following
search space (where $cnt$ is a variable counting up to delay):

$$
\begin{equation}
\begin{array}{}
\underbrace{\begin{array}{}
e_{lo} & e_{hi} & d\\
8 & 8 & 8
\end{array}{}}_{\textit{configuration}} &
\begin{array}{}
e & cnt & status & & total\\
8 & 8 & 1 & = & 41
\end{array}
\end{array}
\end{equation}
$$
  
Thus, we need to check an overall search space of $2^{41}$ states to verify the
system, a huge search space for a very simple example.

In contrast, once the system is deployed and applied in the field, the
values for $e_{lo}$, $e_{hi}$ and $d$ rarely change (once when
the system is deployed, and afterwards only if the user actively changes
the configuration), as opposed to the values of $e$, $cnt$ and
$status$ which vary constantly. Thus, we can mark $e_{lo}$, $e_{hi}$
and $d$ as configuration variables, and verify the system only
when the configuration is changed. By keeping the values of $e_{lo}$,
$e_{hi}$ and $d$ fixed for the verification, the search
space reduces to $2^{17}$ states.
:::

## Implementation {#sec:impl}

The previous section illustrated the potential of conducting verification
after deployment.  Based on that, we now describe in detail a possible
implementation of this methodology. We first describe the
design process in more detail, and then demonstrate it at work with a
formal development of the running example considered in the previous section.

### The Design Process

The design flow starts with a *modelling phase*, where the structure
and behaviour of the system is modelled at an abstract level without
referring to any implementation (see [#fig:design-flow]). In
our case, we use SysML [@SysML] and OCL [@RichtersGogolla2002] to
specify the structure and formalise constraints on its behaviour as well as the
functional hardware description language Clash [@Clash] for a uniform,
executable and synthesiseable model of the system.

The actual specification and implementation languages are of no
particular relevance and could be replaced by others (e.g. we could use
UML instead of SysML, or SystemC instead of Clash), but serve here to
point out the level of abstraction in the corresponding part of the
design process.

From the model, we can synthesise an *implementation* of the system
by generating a representation in a low-level hardware modelling language such as VHDL or
Verilog, which is used to program an FPGA -- constituting the actual
implementation. Moreover, we want to *verify* that the generated
system behaves as specified. In order to do so, we generate a list of
*verification conditions* from the executable system model and the
specification which have to be shown in order to guarantee this.

Specifically, we translate both the Clash model and the constraints from
the OCL specification into *bit-vector logic* (i.e. first-order logic
with bit-vectors). Trying to show these in an SMT prover such as
Yices [@Dutertre:2014] or Z3 [@Moura2008Z3AE] fails for non-trivial examples, as does trying to show the properties
translated into *conjunctive normal form* (CNF) with a SAT solver such as
MiniSat. This is where verification usually fails.

However, post-deployment after we have instantiated the configuration
variables, the search space may become small enough to allow verification of the
corresponding properties even by a lightweight solver [@light-weight-SAT-solving].
By this, verification of all properties becomes possible. Recall that this
instantiation cannot be done at the design time, because at that point the
instantiating values are still unknown. Therefore, the proofs must be rerun
if the values of the configuration variables are changed.

### The Design Process At Work 

In the following, we apply the design flow ([#fig:design-flow]) to the simple example from [#sec:selfie-general-idea].

![Design flow for verification after deployment. We start with modelling
the system behaviour, then derive an implementation and 
verification conditions. By proving the verification conditions, we make sure
the system behaves as specified. Due to the large search space, the
proofs are not possible pre-deployment. But instantiation
of the configuration variables reduces the size of the search space
significantly and makes proofs possible post-deployment.](design-flow.svg){#fig:design-flow}


#### Specification (top of [#fig:design-flow])

The specification of the system is provided in terms of a SysML block definition
diagram as shown in [#fig:design-spec].  The structure is composed of the
controller as the central block, with one luminosity sensor, and one light
switch (actuator) connected. The variables specifying the
lower and upper threshold of luminosity and the delay when switching off
are in a separate block marking them as configuration variables.

![SysML specification of the light controller](sysml-spec.svg){#fig:design-spec width=80%}

The behaviour is provided in OCL as shown in [#fig:ocl-spec]. We model state 
transitions by an explicit operation `tick()`; The pre- and postcondition of the
state transition are denoted as pre- and postconditions of this operation.

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

#### Model (middle of [#fig:design-flow])

Based on the specification, a Clash model is derived.

Clash is a strongly typed domain-specific language to model hardware. It
is embedded into the functional programming language Haskell, and describes
the hardware as functions of the language. The strong type system guarantees
that everything we can describe in Clash is still synthesiseable, and
allows us to model the hardware at an abstract but still executable level.

The model describes the hardware by combinators (higher-order functions),
building up complicated circuits by composing elementary
ones. [#fig:clash] shows the model, essentially a
finite-state machine (a Mealy automaton) with the luminosity values
(*Unsigned 8*) and the configuration as input, the light switch
(*Bool*) as output, and an internal state (*ControllerState*)
which keeps track of the light switch and a counter to implement the delay
when switching off. The function *controllerT* is the state transition 
function of the automation, taking the
state and the input, and returning a tuple of new state and output.

````{.haskell #fig:clash caption="Clash model of the light controller" .standalone}
data Configuration = Configuration {
  e_lo :: Unsigned 8,
  e_hi :: Unsigned 8,
  delay :: Unsigned 8
} deriving Show

configurationControllerT :: Configuration 
  -> (Bool, Configuration) 
  -> (Configuration,Configuration)
configurationControllerT oldConfig (enable,config) = 
  if enable then (config,config) else (oldConfig,oldConfig)

configurationController :: Signal (Bool, Configuration) 
  -> Signal Configuration
configurationController = 
  mealy configurationControllerT (Configuration 63 191 127)

data ControllerState = ControllerState {
  switchState :: Bool,
  cnt :: Unsigned 8
} deriving Show

data ControllerInput = ControllerInput {
  configuration :: Configuration,
  e :: Unsigned 8
} deriving Show

controllerT :: ControllerState 
  -> ControllerInput 
  -> (ControllerState,Bool)
controllerT 
  (ControllerState switchState cnt) 
  (ControllerInput (Configuration e_lo e_hi delay) e)
  | e < e_lo                 = (ControllerState True cntn,True)
  | e > e_hi && cnt >= delay = (ControllerState False cntn,False)
  | otherwise                = (ControllerState switchState cntn,
                                switchState)
    where cntn = if e > e_hi then if cnt < delay then cnt + 1 
                             else cnt else 0

controller :: Signal ControllerInput -> Signal Bool
controller = mealy controllerT (ControllerState False 0)

topEntity :: Signal (Bool,Configuration,Unsigned 8) 
  -> Signal Bool
topEntity input = 
  controller (fmap (uncurry ControllerInput) $ 
    bundle (cfgOut,sensor))
  where (enable,config,sensor) = unbundle input
        cfgOut = configurationController (bundle (enable,config))
````

#### Implementation (left-hand side of [#fig:design-flow])

From the Clash model, we generate Verilog, which is
then compiled onto the FPGA by the proprietary tool chain of the FPGA vendor
(in our case, Xilinx). Thus, the Clash model is the foundation of the
verification after deployment.

#### Verification (right-hand side of [#fig:design-flow]) {#sec:clash-smt}

To prove the verification conditions, we translate them into
CNF, which is suitable as input for reasoning engines such as SAT solvers. 
This translation proceeds in two steps. We first translate both the Clash model 
and the specification into bit-vector logic, which in the second step can be 
translated into CNF by Yices. The translation from Clash is done with an 
extension of the Clash compiler we have developed for this work:

[![martinring/clash-compiler - GitHub](https://gh-card.dev/repos/martinring/clash-compiler.svg?fullname=)](https://github.com/martinring/clash-compiler){.ghlink}

The translation of OCL is done by the tool-chain described in [#chap:specific].

[#fig:bv-spec] shows a small excerpt of the bit-vector representation
of the model from [#fig:clash]. We are modelling the state transition
explicitly, so for each state variable (e.g. *switch*, *cnt*) we have a
variable to model the pre-state (here, *preSwitch*, *preCnt*).
[#fig:bv-spec] asserts that the state switches to *true*
if the luminosity value drops below *e_lo* and it switches to
*false* if the luminosity is above the threshold and
*cnt* is larger or equal to the configured *delay*.

````smt {#fig:bv-spec caption="Implementation modelled in bit-vector logic (excerpt)"}
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

````smt
(=> off_s (not switch))))
(=> (not (or on off_s)) (= switch preSwitch))))
````

We generate a CNF formula from the negated conjunction of all five clauses
(and the invariants) in [#fig:ocl-spec], together with the model from
[#fig:bv-spec]. This formula is satisfiable iff the specification is
violated (because we assert the negated specification).

Because we explore the complete search space (there is no state abstraction
involved), this procedure is not only sound but also complete; if we cannot
find a counter-example, the verification condition holds [for all reachable 
states within the reduced search space]{.added}.

#### Instantiation after Deployment (bottom of [#fig:design-flow])

Finally, the configuration variables are instantiated in order to reduce
the search space.  This is directly conducted in the obtained CNF. In
order to give an impression of the generated CNF, we just consider the very
simple assertion $e \leq e_\text{hi}$, which translates into
bit-vector logic as the assertion:

````smt
(assert (not (bv-lt e e_hi))).
````

Using only two bits for $e$ and $e_\text{hi}$, Yices generates the CNF as shown in
[#fig:cnf-simple], which represents
these bit-vectors as variables, corresponding to the formula. Here, $x$ is an auxiliary
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

So far, the proposed methodology has been illustrated by means of an
intentionally rather limited example. Moving on from that, we have applied
the idea of verification after deployment, and the proposed verification as
described in [#sec:impl], to more sophisticated home automation
controller in order to demonstrate its applicability.

The home controller has been realised on top of a ZedBoard, which comprises an
ARMv7 core running Linux to control a Xilinx FPGA, and which for the
purposes of verification has been equipped with a lightweight SAT
solver [@light-weight-SAT-solving]. The obtained results are summarised
in this section. Furthermore, we also discuss possible ramifications which
have to be considered when utilizing the proposed methodology in practice.

### Evaluation

The proposed methodology has been evaluated on a set of 
systems which are natural extensions of the light controller considered
above to highly versatile home automation controllers as follows:

simple

: The simple light controller 
  with one light and one luminosity sensor (as considered in the running
  example).

average

: An extended version of the controller which
  includes up to 16 sensors to be connected and controls one actuator by
  averaging the values obtained by those sensors. Input and output are
  generic, i.e. we can control any kind of actuator and read from any kind
  of sensor as long as it gives us integer values.

weighted_avg

: A similar version with 32 sensors that allows
  to add a configurable weight to each sensor when computing the average.

smart

: A smart home controller, which allows up to 32
  sensor inputs to be connected to up to 32 actuator outputs. Each input
  can be connected with each output, making the controller very versatile
  and resulting in a huge search space. The smart home controller can be
  used e.g. to control lights, heating and blinds for a number of rooms in
  an office setting.

multiplier

: A 16 bit multiplier component, used to apply the
  weights in *weighted_avg* and *smart*. Can be verified
  with a constant factor once the configuration is set.

For all these systems, we have specified their intended behaviour in OCL,
similar to the specification of the simple light controller in
[#fig:ocl-spec], and have verified that the implementation satisfies
this specification.

[#tab:exp-pre] and [#tab:exp-post] list the results. Column *System* gives the name
of the considered system. The remaining columns summarise the results in
two groups: [#tab:exp-pre] for verification according to the established
verification flow (i.e. verifying all properties at design time) and 
[#tab:exp-post] for the verification methodology proposed here (using the
lightweight solver on the target system). For each group, we
give the size of the search space (i.e. the number of possible solutions to
be checked); the number of variables; the number of clauses of the
resulting CNF; and the run time (in seconds).  The run time is measured on
systems which would typically be used for verification, so they are
directly comparable: for the established verification flow, a compute
server (Intel Xeon E3-1270 v3, eight cores, 16 GB memory) and, for the proposed
verification flow, the ZedBoard (ARMv7, 1GB memory).

Table: Evaluation Results (Established Flow) {#tab:exp-pre}

| System           | Search space | Variables | Clauses | Time     |
|:-----------------|:------------:|----------:|--------:|---------:|
| **simple**       | $2^{41}$     | 161       | 539     | $< 0.1s$ |
| **average**      | $2^{177}$    | 11807     | 40086   | $131.0s$ |
| **weighted_avg** | $2^{545}$    | 43569     | 146642  | $> 24h$  |
| **smart**        | $2^{9504}$   | 1421153   | 4761633 | $> 24h$  |
| **multiplier**   | $2^{32}$     | 1177      | 6096    | $> 24h$  |

Table: Evaluation Results (Proposed Flow, [with randomly assigned values]{.added}) {#tab:exp-post}

| System           | Search space | Variables | Clauses | Time     |
|:-----------------|:------------:|----------:|--------:|---------:|
| **simple**       | $2^{17}$     | 131       | 539     | $< 0.1s$ |
| **average**      | $2^{137}$    | 8181      | 40086   | $1.4s$   |
| **weighted_avg** | $2^{265}$    | 31374     | 146642  | $28.5s$  |
| **smart**        | $2^{544}$    | 1421153   | 2704606 | $1.5s$   |
| **multiplier**   | $2^{16}$     | 809       | 2467    | $418.0s$ |

The obtained results clearly show the benefits of the proposed
approach. Typical embedded systems (as the ones considered here)
allow for a huge variety of configurations. As shown in [#tab:exp-pre], 
this results in a rather large search space and SAT
instance for the verification, which takes a significant amount of time to
solve (in some cases, the corresponding verification task could not be
solved within the given time-limit of one day). In contrast, after deployment, 
configuration variables can be instantiated with their actual values, as
discussed in [#sec:selfie-general-idea]. This substantially reduces
the search space and allows to solve the verification task even on
the limited resources of an embedded system as shown in [#tab:exp-post]. 

Of course, the search space is only one complexity indicator: as the
multiplier system shows, even a comparatively small search space may
require a long time to be verified, because of its inherent
complexity. However, the proposed verification flow reduces the run time
significantly in this example as well, and thus allows us to verify a system
which was previously out of reach for established tools.

### Practical Exploitation {#sec:practical-exploitation}

Our approach may be applied in various ways. In the following we illustrate a possible 
practical application to the design of a smart home controller as described above.

Requirements and properties are established during design time and checked with 
contemporary verification tools. 
Refinements are tracked and verified down to the electronic system level.
All properties which cannot be automatically 
checked during design time are then collected. Some of these properties might be 
provable with interactive theorem provers. The effort has to be weighted up with the 
win here. Those properties which cannot economically be proven are then
prepared for self-verification using our approach.

In the deployed system, a verification controller is constantly watching
the values of the configuration variables and triggers a
proof if a value change is requested. For example, if a light is
connected to the smart home controller, the configuration is updated, and
the proofs have to be re-run. Since the system would now be in an
unverified state, it will either stop operating or defer the value change
until the proofs have successfully finished; this way, it continues
operating with guaranteed safety. (If the risk is considered acceptable, the 
system might instantly change the value and continue to operate while the 
proofs are running.)

This results in a transient state where the
system is unverified for the time it takes to conduct the proof. There are
three possible ways to cope with this:

1. For acceptable risks, the system can just continue operating while the 
   verification is running in parallel. 
2. We can delay the change of the variable and ignore the connected light until 
   correctness has been proven. This sacrifices function for safety.
3. We can stop operation and only continue after the system is proven safe 
   again. This potentially violates non-functional requirements on timing but 
   safety and function are unaffected.

None of these situations is desirable and thus the verification controller
might use statistical observations for the prediction of future
variable-states and proactively verify them during idle-time. If any of these 
states occurs, the system can instantaneously continue operating with guaranteed
safety (see also [#sec:predictive-verification]).

If a proof fails for the resulting configuration, the
system informs the user about the failed proof.  The user can disconnect
the sensor again or try a different configuration until the proof succeeds
and the change results in a safe state. This especially means that the
system can still operate safely even though some functionality is
missing. Furthermore, the manufacturer is informed about the failed
configuration, and can use this information to take appropriate measures.

## Discussion

The results obtained by the conducted cases studies summarised above
clearly show the promises of the proposed verification methodology.
However, some obvious ramifications have to be discussed when evaluating
the general applicability of this methodology.

The proposed methodology obviously requires the system to be equipped with 
on-board verification tools to conduct the verification tasks. Since the 
considered systems are substantially less powerful than usual desktop systems or 
verification servers, this requires lightweight but still efficient versions of 
those tools. Here, recent developments on lightweight methods 
[@light-weight-SAT-solving;@DBLP:series/lncs/BalintS16] as well as endeavours 
towards efficient hardware solvers [@DBLP:conf/dsd/IvanA13;@hardware-SAT-solving] provide 
promising platforms for this purpose. Besides, it should be noted that 
the proposed verification methodology yields an exponential reduction in
the search space, so even less powerful verification tools might be able
to cope. Our evaluation results corroborate this assumption.

Besides that, the obvious question is what happens if the verification
after deployment fails, and the deployed system turns out to be erroneous?
This would be rather unfortunate, but we still believe that conducting
verification after deployment has its value. First, note that this is a
strict improvement over the existing situation, where the error would not
have been detected at all, while verification after deployment at least
shows its existence. This gives vendors the possibility to react (e.g. by
calling the system back, issuing software patches or hardware fixes). Second, 
verification failure does not necessarily indicate an erroneous system; it may 
equally indicate that the configuration variables are instantiated with 
erroneous values. In this case, the system may just pause until it is 
re-configured with allowed values, in this way guaranteeing correct 
functionality.

Our approach differs from *run-time verification*, which is concerned
with "checking whether a *run* of a system under scrutiny satisfies or
violates a given correctness property" [@Leucker:2009]. The central notion of 
run-time verification is the trace (or run) of a system, and central questions 
are how to derive monitors checking a concrete run against an abstract 
specification. The logics employed are typically temporal or modal logics. In 
our work, we are not concerned with monitoring the system at all, we instead 
*specialise* given variables in an abstract specifications if they do not change 
often.

## Conclusion

This Chapter introduced a general approach to Self-Verifying Systems and 
showed it's feasibility by applying it to several case studies. We were 
able to show the general applicability of the approach but a couple of important 
questions have yet to be answered:

1. When exactly should the verification take place and what are the consequences
   of late vs. early verification?
2. Which parts of a system should belong to it's *configuration* and how can we
   systematically determine these parts?

The following chapters will address these questions respectively. 